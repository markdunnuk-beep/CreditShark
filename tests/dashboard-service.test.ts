import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDashboardOverview,
  formatDashboardMoney,
  formatDashboardValue
} from "../src/lib/dashboard/dashboard-service.js";

describe("dashboard overview helpers", () => {
  it("builds safe empty dashboard state", () => {
    const overview = buildDashboardOverview({
      watchlistSummary: null,
      recentChecks: [],
      movementRows: [],
      recentDecisions: [],
      recentReportExports: [],
      monitoringSummary: null
    });

    assert.equal(overview.watchlistSummary.totalWatched, 0);
    assert.equal(overview.recentChecks.length, 0);
    assert.equal(overview.scoreMovements.length, 0);
    assert.equal(overview.monitoringSummary.totalEvents, 0);
  });

  it("shapes recent checks without raw payloads", () => {
    const overview = buildDashboardOverview({
      watchlistSummary: null,
      recentChecks: [{
        company_number: "00445790",
        company_name: "TESCO PLC",
        score_run_id: "score-1",
        score: 62,
        risk_band: "low",
        confidence_level: "medium",
        recommended_limit: "1000.00",
        currency: "GBP",
        run_at: "2026-05-27T09:00:00.000Z",
        source_fetched_at: "2026-05-27T08:59:00.000Z"
      }],
      movementRows: [],
      recentDecisions: [],
      recentReportExports: [],
      monitoringSummary: null
    });

    assert.equal(overview.recentChecks[0]?.recommended_limit, 1000);
    const encoded = JSON.stringify(overview);
    assert.doesNotMatch(encoded, /raw_json|DATABASE_URL|API_KEY|Authorization/i);
  });

  it("creates movement summaries from latest two rows per company", () => {
    const overview = buildDashboardOverview({
      watchlistSummary: null,
      recentChecks: [],
      movementRows: [
        {
          company_number: "00445790",
          company_name: "TESCO PLC",
          score_run_id: "score-2",
          score: 70,
          risk_band: "low",
          run_at: "2026-05-27T10:00:00.000Z",
          rank_number: 1
        },
        {
          company_number: "00445790",
          company_name: "TESCO PLC",
          score_run_id: "score-1",
          score: 62,
          risk_band: "moderate",
          run_at: "2026-05-26T10:00:00.000Z",
          rank_number: 2
        }
      ],
      recentDecisions: [],
      recentReportExports: [],
      monitoringSummary: null
    });

    assert.equal(overview.scoreMovements[0]?.movement.kind, "increase");
    assert.equal(overview.scoreMovements[0]?.movement.delta, 8);
    assert.equal(overview.scoreMovements[0]?.movement.bandChanged, true);
  });

  it("formats dashboard values consistently", () => {
    assert.equal(formatDashboardMoney(1000, "GBP"), "£1,000");
    assert.equal(formatDashboardMoney(null), "Not recorded");
    assert.equal(formatDashboardValue("very_high"), "very high");
    assert.equal(formatDashboardValue(null), "Not available");
  });
});
