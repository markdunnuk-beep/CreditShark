import "dotenv/config";
import { config } from "dotenv";
import { createCompaniesHouseClient } from "../src/lib/companies-house/client.js";

config({ path: ".env.local", override: true });

const query = process.argv.slice(2).join(" ").trim() || "TESCO";
const client = createCompaniesHouseClient();
const result = await client.searchCompanies(query);

if (!result.ok) {
  console.error(`Companies House smoke test failed: ${result.error.code} - ${result.error.message}`);
  if (result.error.endpoint) console.error(`Endpoint: ${result.error.endpoint}`);
  if (result.error.hostname) console.error(`Hostname: ${result.error.hostname}`);
  if (result.error.pathname) console.error(`Pathname: ${result.error.pathname}`);
  if (result.error.errorName) console.error(`Error name: ${result.error.errorName}`);
  if (result.error.errorCode) console.error(`Error code: ${result.error.errorCode}`);
  process.exitCode = 1;
} else {
  const items = result.data.items?.slice(0, 5) ?? [];
  console.log(`Companies House smoke test query: ${query}`);
  console.log(`Results returned: ${result.data.items?.length ?? 0}`);
  for (const item of items) {
    console.log(`- ${item.title} | ${item.company_number} | ${item.company_status ?? "status unavailable"}`);
  }
}
