import type {
  CompaniesHouseChargesResponse,
  CompaniesHouseClientError,
  CompaniesHouseClientResult,
  CompaniesHouseFilingHistoryResponse,
  CompaniesHouseOfficersResponse,
  CompaniesHouseProfile,
  CompaniesHousePscsResponse,
  CompaniesHouseSearchResponse
} from "../../types/companies-house.js";

export interface CompaniesHouseClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

const DEFAULT_BASE_URL = "https://api.company-information.service.gov.uk";
const DEFAULT_TIMEOUT_MS = 10000;

type CompaniesHouseEndpoint =
  | "search_companies"
  | "company_profile"
  | "filing_history"
  | "charges"
  | "officers"
  | "pscs";

export class CompaniesHouseClient {
  private readonly apiKey?: string;
  private readonly baseUrlResult: { ok: true; url: URL } | { ok: false; error: CompaniesHouseClientError };
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: CompaniesHouseClientOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.COMPANIES_HOUSE_API_KEY;
    this.baseUrlResult = validateBaseUrl(options.baseUrl ?? DEFAULT_BASE_URL);
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  searchCompanies(query: string): Promise<CompaniesHouseClientResult<CompaniesHouseSearchResponse>> {
    return this.request("search_companies", "/search/companies", { q: query });
  }

  getCompanyProfile(companyNumber: string): Promise<CompaniesHouseClientResult<CompaniesHouseProfile>> {
    return this.request("company_profile", `/company/${encodeURIComponent(companyNumber)}`);
  }

  getCompanyFilingHistory(companyNumber: string): Promise<CompaniesHouseClientResult<CompaniesHouseFilingHistoryResponse>> {
    return this.request("filing_history", `/company/${encodeURIComponent(companyNumber)}/filing-history`);
  }

  getCompanyCharges(companyNumber: string): Promise<CompaniesHouseClientResult<CompaniesHouseChargesResponse>> {
    return this.request("charges", `/company/${encodeURIComponent(companyNumber)}/charges`);
  }

  getCompanyOfficers(companyNumber: string): Promise<CompaniesHouseClientResult<CompaniesHouseOfficersResponse>> {
    return this.request("officers", `/company/${encodeURIComponent(companyNumber)}/officers`);
  }

  getCompanyPscs(companyNumber: string): Promise<CompaniesHouseClientResult<CompaniesHousePscsResponse>> {
    return this.request("pscs", `/company/${encodeURIComponent(companyNumber)}/persons-with-significant-control`);
  }

  private async request<T>(
    endpoint: CompaniesHouseEndpoint,
    pathname: `/${string}`,
    searchParams: Record<string, string> = {}
  ): Promise<CompaniesHouseClientResult<T>> {
    const urlResult = this.buildUrl(endpoint, pathname, searchParams);
    if (!urlResult.ok) {
      return { ok: false, error: urlResult.error };
    }

    if (!this.apiKey) {
      return {
        ok: false,
        error: {
          code: "missing_api_key",
          message: "COMPANIES_HOUSE_API_KEY is required for Companies House requests.",
          ...endpointDiagnostics(endpoint, urlResult.url)
        }
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(urlResult.url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`,
          Accept: "application/json"
        },
        signal: controller.signal
      });

      if (!response.ok) {
        return { ok: false, error: mapErrorResponse(response, endpoint, urlResult.url) };
      }

      return { ok: true, status: response.status, data: (await response.json()) as T };
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      return {
        ok: false,
        error: {
          code: isAbort ? "timeout" : "network_error",
          message: isAbort ? "Companies House request timed out." : "Companies House request failed before a response was received.",
          ...endpointDiagnostics(endpoint, urlResult.url),
          ...safeFetchError(error)
        }
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(
    endpoint: CompaniesHouseEndpoint,
    pathname: `/${string}`,
    searchParams: Record<string, string>
  ): { ok: true; url: URL } | { ok: false; error: CompaniesHouseClientError } {
    if (!this.baseUrlResult.ok) {
      return { ok: false, error: { ...this.baseUrlResult.error, endpoint } };
    }

    const url = new URL(pathname, this.baseUrlResult.url);
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
    return { ok: true, url };
  }
}

function validateBaseUrl(value: string): { ok: true; url: URL } | { ok: false; error: CompaniesHouseClientError } {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.hostname) {
      return {
        ok: false,
        error: {
          code: "invalid_base_url",
          message: "Companies House base URL is invalid."
        }
      };
    }
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return { ok: true, url };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "invalid_base_url",
        message: "Companies House base URL is invalid.",
        ...safeFetchError(error)
      }
    };
  }
}

function mapErrorResponse(response: Response, endpoint: CompaniesHouseEndpoint, url: URL): CompaniesHouseClientError {
  if (response.status === 404) {
    return {
      status: response.status,
      code: "not_found",
      message: "Companies House resource was not found.",
      ...endpointDiagnostics(endpoint, url)
    };
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    return {
      status: response.status,
      code: "rate_limited",
      message: "Companies House rate limit was reached.",
      retryAfterSeconds: retryAfter ? Number(retryAfter) : undefined,
      ...endpointDiagnostics(endpoint, url)
    };
  }

  return {
    status: response.status,
    code: "upstream_error",
    message: `Companies House returned HTTP ${response.status}.`,
    ...endpointDiagnostics(endpoint, url)
  };
}

function endpointDiagnostics(endpoint: CompaniesHouseEndpoint, url: URL): Pick<CompaniesHouseClientError, "endpoint" | "hostname" | "pathname"> {
  return {
    endpoint,
    hostname: url.hostname,
    pathname: url.pathname
  };
}

function safeFetchError(error: unknown): Pick<CompaniesHouseClientError, "errorName" | "errorCode"> {
  if (!error || typeof error !== "object") return {};
  const record = error as Record<string, unknown>;
  return {
    errorName: typeof record.name === "string" ? record.name : undefined,
    errorCode: typeof record.code === "string" ? record.code : undefined
  };
}

export function createCompaniesHouseClient(options?: CompaniesHouseClientOptions): CompaniesHouseClient {
  return new CompaniesHouseClient(options);
}
