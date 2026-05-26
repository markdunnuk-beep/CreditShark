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

