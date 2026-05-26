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

export class CompaniesHouseClient {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: CompaniesHouseClientOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.COMPANIES_HOUSE_API_KEY;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  searchCompanies(query: string): Promise<CompaniesHouseClientResult<CompaniesHouseSearchResponse>> {
    return this.request(`/search/companies?q=${encodeURIComponent(query)}`);
  }

  getCompanyProfile(companyNumber: string): Promise<CompaniesHouseClientResult<CompaniesHouseProfile>> {
    return this.request(`/company/${encodeURIComponent(companyNumber)}`);
  }

  getCompanyFilingHistory(companyNumber: string): Promise<CompaniesHouseClientResult<CompaniesHouseFilingHistoryResponse>> {
    return this.request(`/company/${encodeURIComponent(companyNumber)}/filing-history`);
  }

  getCompanyCharges(companyNumber: string): Promise<CompaniesHouseClientResult<CompaniesHouseChargesResponse>> {
    return this.request(`/company/${encodeURIComponent(companyNumber)}/charges`);
  }

  getCompanyOfficers(companyNumber: string): Promise<CompaniesHouseClientResult<CompaniesHouseOfficersResponse>> {
    return this.request(`/company/${encodeURIComponent(companyNumber)}/officers`);
  }

  getCompanyPscs(companyNumber: string): Promise<CompaniesHouseClientResult<CompaniesHousePscsResponse>> {
    return this.request(`/company/${encodeURIComponent(companyNumber)}/persons-with-significant-control`);
  }

  private async request<T>(path: string): Promise<CompaniesHouseClientResult<T>> {
    if (!this.apiKey) {
      return {
        ok: false,
        error: {
          code: "missing_api_key",
          message: "COMPANIES_HOUSE_API_KEY is required for Companies House requests."
        }
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`,
          Accept: "application/json"
        },
        signal: controller.signal
      });

      if (!response.ok) {
        return { ok: false, error: mapErrorResponse(response) };
      }

      return { ok: true, status: response.status, data: (await response.json()) as T };
    } catch (error) {
      const isAbort = error instanceof Error && error.name === "AbortError";
      return {
        ok: false,
        error: {
          code: isAbort ? "timeout" : "network_error",
          message: isAbort ? "Companies House request timed out." : "Companies House request failed before a response was received."
        }
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function mapErrorResponse(response: Response): CompaniesHouseClientError {
  if (response.status === 404) {
    return { status: response.status, code: "not_found", message: "Companies House resource was not found." };
  }

  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    return {
      status: response.status,
      code: "rate_limited",
      message: "Companies House rate limit was reached.",
      retryAfterSeconds: retryAfter ? Number(retryAfter) : undefined
    };
  }

  return {
    status: response.status,
    code: "upstream_error",
    message: `Companies House returned HTTP ${response.status}.`
  };
}

export function createCompaniesHouseClient(options?: CompaniesHouseClientOptions): CompaniesHouseClient {
  return new CompaniesHouseClient(options);
}

