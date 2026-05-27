import "dotenv/config";
import { config } from "dotenv";
import { createCompanySnapshotFromCompaniesHouse } from "../src/lib/companies/company-snapshot-service.js";

config({ path: ".env.local", override: true });

const companyNumbers = process.argv.slice(2);

if (companyNumbers.length === 0) {
  console.error("Usage: npm run smoke:company-snapshot-batch -- 00445790 06895946");
  process.exit(1);
}

let failed = false;

for (const companyNumber of companyNumbers) {
  const result = await createCompanySnapshotFromCompaniesHouse(companyNumber, {
    actorId: null,
    createdVia: "smoke_company_snapshot_batch_script"
  });

  if (!result.ok) {
    failed = true;
    console.error(`FAIL ${companyNumber} stage=${result.error.stage} reference=${result.error.referenceCode} code=${result.error.code}`);
    console.error(`  ${result.error.message}`);
  } else {
    console.log(
      `PASS ${result.data.company.company_number} snapshot=${result.data.snapshot.id} filings=${result.data.filingsSummary.count} charges=${result.data.chargesSummary.count} officers=${result.data.officersSummary.count} pscs=${result.data.pscSummary.count} missing=${result.data.missingSections.length ? result.data.missingSections.join(",") : "none"}`
    );
  }
}

if (failed) {
  process.exitCode = 1;
}
