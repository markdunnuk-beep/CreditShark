import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CREDITSHARK_FOOTER_DISCLAIMER } from "../src/lib/guardrails.js";
import { formatReasonGroup, formatSignedImpact } from "../app/components/ui/reason-code-card.js";
import { formatRiskBandLabel, mapRiskBandToBadgeVariant } from "../app/components/ui/risk-badge.js";
import { clampTradeRiskScore, scoreToGaugeOffset } from "../app/components/ui/trade-risk-score-gauge.js";
import { formatUiValue } from "../app/components/ui/utils.js";

describe("CreditShark design-system helpers", () => {
  it("maps persisted risk-band values to display variants without changing the model values", () => {
    assert.equal(mapRiskBandToBadgeVariant("very_low"), "low");
    assert.equal(mapRiskBandToBadgeVariant("low"), "low");
    assert.equal(mapRiskBandToBadgeVariant("moderate"), "moderate");
    assert.equal(mapRiskBandToBadgeVariant("elevated"), "elevated");
    assert.equal(mapRiskBandToBadgeVariant("high"), "high");
    assert.equal(mapRiskBandToBadgeVariant("very_high"), "high");
    assert.equal(mapRiskBandToBadgeVariant("not_scored"), "neutral");
  });

  it("formats risk bands as plain-English labels", () => {
    assert.equal(formatRiskBandLabel("very_high"), "Very High");
    assert.equal(formatRiskBandLabel("not_scored"), "Not Scored");
    assert.equal(formatRiskBandLabel(null), "Not available");
  });

  it("clamps trade-risk score values for the gauge only", () => {
    assert.equal(clampTradeRiskScore(-10), 0);
    assert.equal(clampTradeRiskScore(47.6), 48);
    assert.equal(clampTradeRiskScore(120), 100);
    assert.equal(clampTradeRiskScore(null), null);
  });

  it("derives gauge offsets from the clamped score", () => {
    assert.equal(scoreToGaugeOffset(0), 100);
    assert.equal(scoreToGaugeOffset(64), 36);
    assert.equal(scoreToGaugeOffset(100), 0);
    assert.equal(scoreToGaugeOffset(null), 100);
  });

  it("keeps UI helper labels separate from the full footer disclaimer", () => {
    assert.ok(!formatRiskBandLabel("very_high").includes(CREDITSHARK_FOOTER_DISCLAIMER));
  });

  it("formats reason-code helper values consistently", () => {
    assert.equal(formatSignedImpact(5), "+5");
    assert.equal(formatSignedImpact(-8), "-8");
    assert.equal(formatReasonGroup("manual_adverse_events"), "Manual data included");
    assert.equal(formatReasonGroup("custom_group"), "custom group");
  });

  it("formats generic UI values without introducing legal copy", () => {
    assert.equal(formatUiValue("source-linked_evidence"), "source linked evidence");
    assert.equal(formatUiValue(null), "Not available");
    assert.equal(formatUiValue("source-linked_evidence").includes(CREDITSHARK_FOOTER_DISCLAIMER), false);
  });
});
