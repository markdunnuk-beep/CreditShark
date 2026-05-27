import "dotenv/config";
import { config } from "dotenv";
import { createCompanySnapshotFromCompaniesHouse } from "../src/lib/companies/company-snapshot-service.js";
import { runAndPersistScoreForLatestSnapshot } from "../src/lib/scoring/scoring-service.js";

config({ path: ".env.local", override: true });

const companyNumber = process.argv[2] ?? "00445790";

const snapshotResult = await createCompanySnapshotFromCompaniesHouse(companyNumber, {
  actorId: null,
  createdVia: "smoke_score_run_script"
});

if (!snapshotResult.ok) {
  console.error(`Score smoke test failed while creating snapshot: ${snapshotResult.error.code}`);
  console.error(`Company number: ${companyNumber}`);
  console.error(`Stage: ${snapshotResult.error.stage}`);
  console.error(`Reference: ${snapshotResult.error.referenceCode}`);
  console.error(`Message: ${snapshotResult.error.message}`);
  process.exitCode = 1;
} else {
  const scoreResult = await runAndPersistScoreForLatestSnapshot(snapshotResult.data.company.company_number, {
    actorId: null,
    createdVia: "smoke_score_run_script"
  });

  if (!scoreResult.ok) {
    console.error(`Score smoke test failed: ${scoreResult.error.code} - ${scoreResult.error.message}`);
    process.exitCode = 1;
  } else {
    const data = scoreResult.data;
    console.log(`Company: ${data.company.company_name}`);
    console.log(`Company number: ${data.company.company_number}`);
    console.log(`Snapshot id: ${data.snapshot.id}`);
    console.log(`Score run id: ${data.scoreRun.id}`);
    console.log(`Score: ${data.scoreRun.score ?? "not scored"}`);
    console.log(`Risk band: ${data.scoreRun.riskBand}`);
    console.log(`Confidence: ${data.scoreRun.confidenceLevel}`);
    console.log(`Recommended limit: ${data.scoreRun.currency} ${data.scoreRun.recommendedLimit}`);
    console.log(`Reason codes: ${data.reasonCodes.length}`);
    console.log(`Missing data flags: ${data.missingDataFlags.length ? data.missingDataFlags.join(", ") : "none"}`);
  }
}
