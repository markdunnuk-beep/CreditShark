import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateScoreMovement } from "../src/lib/history/score-history-service.js";
import { getMonitoringSeverityForMovement } from "../src/lib/watchlist/monitoring-event-service.js";
import {
  buildWatchlistSummaryFromItems,
  createWatchlistAuditMetadata,
  formatWatchlistMoney,
  type WatchlistCompanyContext
} from "../src/lib/watchlist/watchlist-service.js";
import type { RiskBand } from "../src/types/creditshark.js";

describe("watchlist helpers", () => {
  it("summarises watched company risk and manual adverse counts", () => {
    const items = [
      context("00445790", "low", 0),
      context("00000001", "high", 2),
      context("00000002", "very_high", 1),
      context("00000003", "moderate", 0)
    ];

    const summary = buildWatchlistSummaryFromItems(items);

    assert.equal(summary.totalWatched, 4);
    assert.equal(summary.highOrVeryHighRiskCount, 2);
    assert.equal(summary.requiringReviewCount, 3);
    assert.equal(summary.activeManualAdverseEventCount, 3);
  });

  it("formats limits consistently", () => {
    assert.equal(formatWatchlistMoney(1000, "GBP"), "£1,000");
    assert.equal(formatWatchlistMoney(null, "GBP"), "Not available");
  });

  it("audit metadata excludes notes and secret-like fields", () => {
    const metadata = createWatchlistAuditMetadata({
      companyNumber: "00445790",
      watchlistId: "00000000-0000-0000-0000-000000000001",
      watchReasonPresent: true,
      createdVia: "unit_test"
    });

    assert.deepEqual(metadata, {
      company_number: "00445790",
      watchlist_id: "00000000-0000-0000-0000-000000000001",
      watch_reason_present: true,
      created_via: "unit_test"
    });
    assert.doesNotMatch(JSON.stringify(metadata), /DATABASE_URL|API_KEY|Authorization|Bearer|postgres:\/\/|reason text/i);
  });

  it("maps monitoring severity from score movement without inventing source events", () => {
    assert.equal(getMonitoringSeverityForMovement({ latestRiskBand: "high", previousRiskBand: "moderate", scoreDelta: -12 }), "material");
    assert.equal(getMonitoringSeverityForMovement({ latestRiskBand: "moderate", previousRiskBand: "low", scoreDelta: -6 }), "review");
    assert.equal(getMonitoringSeverityForMovement({ latestRiskBand: "low", previousRiskBand: "low", scoreDelta: 3 }), "info");
  });
});

function context(companyNumber: string, riskBand: RiskBand, manualCount: number): WatchlistCompanyContext {
  return {
    watchlist: {
      id: `watch-${companyNumber}`,
      company_id: `company-${companyNumber}`,
      added_by: null,
      added_at: new Date().toISOString(),
      is_active: true,
      removed_by: null,
      removed_at: null,
      watch_reason: null,
      last_checked_at: new Date().toISOString()
    },
    company: {
      id: `company-${companyNumber}`,
      company_number: companyNumber,
      company_name: "Test company"
    },
    latestScore: {
      score_run_id: `score-${companyNumber}`,
      snapshot_id: `snapshot-${companyNumber}`,
      score: 62,
      risk_band: riskBand,
      confidence_level: "low",
      recommended_limit: 1000,
      currency: "GBP",
      run_at: new Date().toISOString(),
      source_fetched_at: new Date().toISOString()
    },
    latestDecision: null,
    latestReport: null,
    scoreMovement: calculateScoreMovement({ score: 62, risk_band: riskBand }, { score: 60, risk_band: "moderate" }),
    activeManualAdverseEventCount: manualCount
  };
}
