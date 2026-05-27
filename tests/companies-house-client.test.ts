import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CompaniesHouseClient } from "../src/lib/companies-house/client.js";

describe("CompaniesHouseClient", () => {
  it("returns a typed missing-api-key error without making a live API call", async () => {
    const client = new CompaniesHouseClient({
      apiKey: "",
      fetchImpl: async () => {
        throw new Error("fetch should not be called without an API key");
      }
    });

    const result = await client.searchCompanies("example");

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "missing_api_key");
    }
  });

  it("sends Basic auth and returns typed data using a mocked fetch", async () => {
    let authHeader: string | null = null;
    const client = new CompaniesHouseClient({
      apiKey: "test-key",
      baseUrl: "https://example.test",
      fetchImpl: async (_url, init) => {
        authHeader = new Headers(init?.headers).get("authorization");
        return new Response(JSON.stringify({ items: [{ company_number: "12345678", title: "Example Limited" }] }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }
    });

    const result = await client.searchCompanies("Example");

    assert.equal(result.ok, true);
    assert.equal(authHeader, `Basic ${Buffer.from("test-key:").toString("base64")}`);
    if (result.ok) {
      assert.equal(result.data.items?.[0]?.company_number, "12345678");
    }
  });

  it("constructs the search URL on the configured Companies House host", async () => {
    const urls = await captureRequestUrls((client) => client.searchCompanies("06895946"));

    assert.deepEqual(urls, ["https://api.company-information.service.gov.uk/search/companies?q=06895946"]);
  });

  it("constructs the profile URL without treating the path as a hostname", async () => {
    const urls = await captureRequestUrls((client) => client.getCompanyProfile("06895946"));

    assert.deepEqual(urls, ["https://api.company-information.service.gov.uk/company/06895946"]);
  });

  it("constructs filing, charge, officer and PSC URLs without duplicate segments", async () => {
    const urls = await captureRequestUrls(async (client) => {
      await client.getCompanyFilingHistory("06895946");
      await client.getCompanyCharges("06895946");
      await client.getCompanyOfficers("06895946");
      await client.getCompanyPscs("06895946");
    });

    assert.deepEqual(urls, [
      "https://api.company-information.service.gov.uk/company/06895946/filing-history",
      "https://api.company-information.service.gov.uk/company/06895946/charges",
      "https://api.company-information.service.gov.uk/company/06895946/officers",
      "https://api.company-information.service.gov.uk/company/06895946/persons-with-significant-control"
    ]);
  });

  it("rejects malformed base URLs before making a fetch call", async () => {
    let fetchCalled = false;
    const client = new CompaniesHouseClient({
      apiKey: "test-key",
      baseUrl: "api.company-information.service.gov.uk/company",
      fetchImpl: async () => {
        fetchCalled = true;
        return new Response("{}");
      }
    });

    const result = await client.getCompanyProfile("06895946");

    assert.equal(fetchCalled, false);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "invalid_base_url");
      assert.equal(result.error.endpoint, "company_profile");
    }
  });

  it("returns safe endpoint diagnostics for ENOTFOUND-style fetch failures", async () => {
    const client = new CompaniesHouseClient({
      apiKey: "test-key",
      fetchImpl: async () => {
        throw Object.assign(new TypeError("fetch failed"), { code: "ENOTFOUND" });
      }
    });

    const result = await client.getCompanyProfile("06895946");

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "network_error");
      assert.equal(result.error.endpoint, "company_profile");
      assert.equal(result.error.hostname, "api.company-information.service.gov.uk");
      assert.equal(result.error.pathname, "/company/06895946");
      assert.equal(result.error.errorName, "TypeError");
      assert.equal(result.error.errorCode, "ENOTFOUND");
      assert.doesNotMatch(JSON.stringify(result.error), /test-key|authorization|basic/i);
    }
  });

  it("normalises rate-limit responses", async () => {
    const client = new CompaniesHouseClient({
      apiKey: "test-key",
      baseUrl: "https://example.test",
      fetchImpl: async () => new Response("Too many requests", { status: 429, headers: { "retry-after": "30" } })
    });

    const result = await client.getCompanyProfile("12345678");

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, "rate_limited");
      assert.equal(result.error.retryAfterSeconds, 30);
    }
  });
});

async function captureRequestUrls(run: (client: CompaniesHouseClient) => Promise<unknown>): Promise<string[]> {
  const urls: string[] = [];
  const client = new CompaniesHouseClient({
    apiKey: "test-key",
    fetchImpl: async (url) => {
      urls.push(url.toString());
      return new Response(JSON.stringify({ items: [] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
  });

  await run(client);
  return urls;
}
