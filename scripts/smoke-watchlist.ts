import { config } from "dotenv";
import { createCompanySnapshotFromCompaniesHouse } from "../src/lib/companies/company-snapshot-service";
import { runAndPersistScoreForLatestSnapshot } from "../src/lib/scoring/scoring-service";
import { addCompanyToWatchlist, getWatchlist, removeCompanyFromWatchlist } from "../src/lib/watchlist/watchlist-service";

config({ path: ".env.local" });

const companyNumber = process.argv[2]?.trim() || "00445790";

async function main() {
  const snapshot = await createCompanySnapshotFromCompaniesHouse(companyNumber, {
    createdVia: "smoke_watchlist"
  });
  if (!snapshot.ok) {
    throw new Error(`snapshot failed: ${snapshot.error.message}`);
  }

  const score = await runAndPersistScoreForLatestSnapshot(companyNumber, {
    createdVia: "smoke_watchlist"
  });
  if (!score.ok) {
    throw new Error(`score failed: ${score.error.message}`);
  }

  const added = await addCompanyToWatchlist(companyNumber, {
    watchReason: "Smoke test watchlist workflow validation."
  }, {
    createdVia: "smoke_watchlist"
  });
  if (!added.ok) {
    throw new Error(`watchlist add failed: ${added.error.message}`);
  }

  const watchlist = await getWatchlist();
  if (!watchlist.ok) {
    throw new Error(`watchlist load failed: ${watchlist.error.message}`);
  }

  const item = watchlist.data.items.find((entry) => entry.company.company_number === snapshot.data.company.company_number);
  console.log("Watchlist smoke passed");
  console.log(`Company number: ${snapshot.data.company.company_number}`);
  console.log(`Watchlist id: ${added.data.id}`);
  console.log(`Current score: ${item?.latestScore?.score ?? "not available"}`);
  console.log(`Risk band: ${item?.latestScore?.risk_band ?? "not available"}`);
  console.log(`Watched count: ${watchlist.data.summary.totalWatched}`);

  const removed = await removeCompanyFromWatchlist(companyNumber, {
    createdVia: "smoke_watchlist_cleanup"
  });
  if (!removed.ok) {
    console.log(`Cleanup note: watchlist row remains active because removal failed at ${removed.error.code}.`);
    process.exitCode = 1;
    return;
  }
  console.log("Cleanup: smoke watchlist item was deactivated, not deleted.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Watchlist smoke failed.");
  process.exitCode = 1;
});
