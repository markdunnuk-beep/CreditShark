import "dotenv/config";
import { config } from "dotenv";
import { createCompanySnapshotFromCompaniesHouse } from "../src/lib/companies/company-snapshot-service.js";
import { formatHistoryMoney, getScoreHistoryForCompany } from "../src/lib/history/score-history-service.js";
import { getLatestScoreRunForCompany, runAndPersistScoreForLatestSnapshot } from "../src/lib/scoring/scoring-service.js";

config({ path: ".env.local", override: true });

const companyNumber = process.argv[2] ?? "00445790";

let historyResult = await getScoreHistoryForCompany(companyNumber, { limit: 10 });

if (historyResult.ok && historyResult.data.rows.length === 0) {
  let scoreResult = await getLatestScoreRunForCompany(companyNumber);
  if (!scoreResult.ok) {
    const snapshotResult = await createCompanySnapshotFromCompaniesHouse(companyNumber, {
      actorId: null,
      createdVia: "smoke_score_history_script"
    });

    if (!snapshotResult.ok) {
      console.error(`Score history smoke failed while creating snapshot: ${snapshotResult.error.code}`);
      console.error(`Stage: ${snapshotResult.error.stage}`);
      console.error(`Reference: ${snapshotResult.error.referenceCode}`);
      console.error(`Message: ${snapshotResult.error.message}`);
      process.exit(1);
    }

    scoreResult = await runAndPersistScoreForLatestSnapshot(snapshotResult.data.company.company_number, {
      actorId: null,
      createdVia: "smoke_score_history_script"
    });
  }

  if (!scoreResult.ok) {
    console.error(`Score history smoke failed while creating score: ${scoreResult.error.code} - ${scoreResult.error.message}`);
    process.exit(1);
  }

  historyResult = await getScoreHistoryForCompany(companyNumber, { limit: 10 });
}

if (!historyResult.ok) {
  console.error(`Score history smoke failed: ${historyResult.error.code} - ${historyResult.error.message}`);
  process.exitCode = 1;
} else {
  const history = historyResult.data;
  console.log(`Company number: ${history.company.company_number}`);
  console.log(`Score run count: ${history.rows.length}`);
  console.log(`Latest score: ${history.latest?.score ?? "not scored"}`);
  console.log(`Previous score: ${history.previous?.score ?? "not available"}`);
  console.log(`Movement: ${history.movement.message}`);
  console.log(`Latest risk band: ${history.latest?.risk_band ?? "not available"}`);
  console.log(`Latest recommended limit: ${formatHistoryMoney(history.latest?.recommended_limit, history.latest?.currency ?? "GBP")}`);
}
