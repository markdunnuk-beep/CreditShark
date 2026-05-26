import "dotenv/config";
import { config } from "dotenv";
import { createCompanySnapshotFromCompaniesHouse } from "../src/lib/companies/company-snapshot-service.js";

config({ path: ".env.local", override: true });

const companyNumber = process.argv[2] ?? "00445790";
const result = await createCompanySnapshotFromCompaniesHouse(companyNumber, {
  actorId: null,
  createdVia: "smoke_company_snapshot_script"
});

if (!result.ok) {
  console.error(`Snapshot smoke test failed: ${result.error.code} - ${result.error.message}`);
  process.exitCode = 1;
} else {
  const snapshot = result.data;
  console.log(`Company: ${snapshot.company.company_name}`);
  console.log(`Company number: ${snapshot.company.company_number}`);
  console.log(`Snapshot id: ${snapshot.snapshot.id}`);
  console.log(`Fetched at: ${snapshot.sourceFetchedAt}`);
  console.log(`Filings: ${snapshot.filingsSummary.count}`);
  console.log(`Charges: ${snapshot.chargesSummary.count}`);
  console.log(`Officers: ${snapshot.officersSummary.count}`);
  console.log(`PSCs: ${snapshot.pscSummary.count}`);
  console.log(`Missing sections: ${snapshot.missingSections.length ? snapshot.missingSections.join(", ") : "none"}`);
}

