import "dotenv/config";
import { config } from "dotenv";
import { createCompaniesHouseClient } from "../src/lib/companies-house/client.js";

config({ path: ".env.local", override: true });

const query = process.argv.slice(2).join(" ").trim() || "TESCO";
const client = createCompaniesHouseClient();
const result = await client.searchCompanies(query);

if (!result.ok) {
  console.error(`Companies House smoke test failed: ${result.error.code} - ${result.error.message}`);
  process.exitCode = 1;
} else {
  const items = result.data.items?.slice(0, 5) ?? [];
  console.log(`Companies House smoke test query: ${query}`);
  console.log(`Results returned: ${result.data.items?.length ?? 0}`);
  for (const item of items) {
    console.log(`- ${item.title} | ${item.company_number} | ${item.company_status ?? "status unavailable"}`);
  }
}
