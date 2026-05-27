import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildScoreHistoryRows,
  buildScoreHistoryViewModel,
  calculateScoreMovement,
  formatHistoryMoney
} from "../src/lib/history/score-history-service.js";

describe("score history helpers", () => {
  it("handles zero score runs", () => {
    const view = buildScoreHistoryViewModel({ id: "company", company_number: "00445790", company_name: "TESCO PLC" }, []);

    assert.equal(view.latest, null);
    assert.equal(view.movement.message, "No score runs are available yet.");
  });

  it("handles one score run", () => {
    const movement = calculateScoreMovement({ score: 62, risk_band: "low" }, null);

    assert.equal(movement.kind, "none");
    assert.equal(movement.message, "Only one score run available so far.");
  });

  it("detects score increase, decrease and unchanged", () => {
    assert.equal(calculateScoreMovement({ score: 70, risk_band: "low" }, { score: 62, risk_band: "moderate" }).kind, "increase");
    assert.equal(calculateScoreMovement({ score: 55, risk_band: "moderate" }, { score: 62, risk_band: "low" }).kind, "decrease");
    assert.equal(calculateScoreMovement({ score: 62, risk_band: "low" }, { score: 62, risk_band: "low" }).kind, "unchanged");
  });

  it("detects risk-band changes", () => {
    const movement = calculateScoreMovement({ score: 70, risk_band: "low" }, { score: 50, risk_band: "moderate" });

    assert.equal(movement.bandChanged, true);
    assert.equal(movement.bandMessage, "Risk band moved from moderate to low.");
  });

  it("includes decision and report flags in rows", () => {
    const rows = buildScoreHistoryRows([
      {
        score_run_id: "00000000-0000-0000-0000-000000000001",
        snapshot_id: "00000000-0000-0000-0000-000000000002",
        score: 62,
        risk_band: "low",
        confidence_level: "low",
        recommended_limit: 1000,
        currency: "GBP",
        missing_data_flags_json: ["financial_metrics_missing"],
        run_at: "2026-05-27T08:00:00.000Z",
        source_fetched_at: "2026-05-27T07:59:00.000Z",
        model_version: "1.0.0"
      }
    ], [
      {
        score_run_id: "00000000-0000-0000-0000-000000000001",
        label: "Active company",
        direction: "positive",
        group: "company_status",
        weight: 10,
        sort_order: 0
      },
      {
        score_run_id: "00000000-0000-0000-0000-000000000001",
        label: "Financial metrics unavailable",
        direction: "missing",
        group: "financial_strength",
        weight: -8,
        sort_order: 1
      }
    ], [
      {
        id: "decision",
        score_run_id: "00000000-0000-0000-0000-000000000001",
        decision: "refer",
        decision_value: "refer_for_review",
        decided_at: "2026-05-27T08:05:00.000Z"
      }
    ], [
      {
        score_run_id: "00000000-0000-0000-0000-000000000001",
        latest_export_id: "export",
        latest_exported_at: "2026-05-27T08:06:00.000Z",
        export_count: 1
      }
    ]);

    assert.equal(rows[0]?.decision?.decision_value, "refer_for_review");
    assert.equal(rows[0]?.report.export_count, 1);
    assert.equal(rows[0]?.top_positive_reason?.label, "Active company");
    assert.equal(rows[0]?.top_review_reason?.label, "Financial metrics unavailable");
    assert.doesNotMatch(JSON.stringify(rows), /raw_json|DATABASE_URL|API_KEY|Authorization/i);
  });

  it("formats limits consistently", () => {
    assert.equal(formatHistoryMoney(1000, "GBP"), "£1,000");
    assert.equal(formatHistoryMoney(null, "GBP"), "Not recorded");
  });
});
