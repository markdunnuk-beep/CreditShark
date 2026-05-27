import "dotenv/config";
import { config } from "dotenv";
import { createCompanySnapshotFromCompaniesHouse } from "../src/lib/companies/company-snapshot-service.js";
import { createDecisionRecord } from "../src/lib/decisions/decision-service.js";
import { getLatestScoreRunForCompany, runAndPersistScoreForLatestSnapshot } from "../src/lib/scoring/scoring-service.js";

config({ path: ".env.local", override: true });

const companyNumber = process.argv[2] ?? "00445790";

let scoreResult = await getLatestScoreRunForCompany(companyNumber);

if (!scoreResult.ok) {
  const snapshotResult = await createCompanySnapshotFromCompaniesHouse(companyNumber, {
    actorId: null,
    createdVia: "smoke_decision_record_script"
  });

  if (!snapshotResult.ok) {
    console.error(`Decision smoke test failed while creating snapshot: ${snapshotResult.error.code}`);
    console.error(`Stage: ${snapshotResult.error.stage}`);
    console.error(`Reference: ${snapshotResult.error.referenceCode}`);
    console.error(`Message: ${snapshotResult.error.message}`);
    process.exit(1);
  }

  scoreResult = await runAndPersistScoreForLatestSnapshot(snapshotResult.data.company.company_number, {
    actorId: null,
    createdVia: "smoke_decision_record_script"
  });
}

if (!scoreResult.ok) {
  console.error(`Decision smoke test failed while loading score: ${scoreResult.error.code} - ${scoreResult.error.message}`);
  process.exit(1);
}

const result = await createDecisionRecord(companyNumber, {
  decision: "refer_for_review",
  requested_limit: 1000,
  approved_limit: null,
  currency: "GBP",
  reviewer_notes: "Smoke test decision record for workflow validation.",
  override_reason: null
}, {
  actorId: null,
  createdVia: "smoke_decision_record_script"
});

if (!result.ok) {
  console.error(`Decision smoke test failed: ${result.error.code} - ${result.error.message}`);
  if (result.error.fieldErrors) {
    console.error(`Field errors: ${Object.keys(result.error.fieldErrors).join(", ")}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Company number: ${scoreResult.data.company.company_number}`);
  console.log(`Decision record id: ${result.data.id}`);
  console.log(`Score run id: ${result.data.score_run_id}`);
  console.log(`Decision: ${result.data.decision_value}`);
  console.log(`Requested limit: ${result.data.currency} ${result.data.requested_limit ?? "not recorded"}`);
  console.log(`Approved limit: ${result.data.currency} ${result.data.approved_limit ?? "not recorded"}`);
  console.log("Cleanup: decision records are immutable; leave this smoke record in place or reset the test database if needed.");
}
