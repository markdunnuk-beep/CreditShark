import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapScoreToRiskBand, runCreditSharkScore } from "../src/lib/scoring/engine.js";
import type { CompanySnapshot, ManualAdverseEvent, ScoringModelVersion } from "../src/types/creditshark.js";

const modelVersion: ScoringModelVersion = {
  id: "model-v1",
  version: "1.0.0",
  status: "published",
  changeNote: "Initial MVP scoring model",
  bandThresholds: {
    veryLowRisk: { min: 81, max: 100 },
    lowRisk: { min: 61, max: 80 },
    moderateRisk: { min: 41, max: 60 },
    highRisk: { min: 21, max: 40 },
    veryHighRisk: { min: 1, max: 20 },
    notScored: null
  },
  factorWeights: {
    baseline: 60,
    companyStatus: {},
    companyAge: {},
    filingBehaviour: {},
    financialStrength: {},
    charges: {},
    manualAdverseEvents: {},
    directorPscSignals: {},
    sicSector: {},
    dataCompleteness: {}
  },
  limitRules: {
    currency: "GBP",
    defaultLimits: {
      veryLowRisk: 25000,
      lowRisk: 10000,
      moderateRisk: 2500,
      highRisk: 500,
      veryHighRisk: 0,
      notScored: 0
    },
    confidenceCaps: {
      high: null,
      medium: 10000,
      low: 1000,
      insufficient: 0
    },
    newCompanyCap: 1000,
    manualReviewCap: 0
  }
};

const baseSnapshot: CompanySnapshot = {
  id: "snapshot-1",
  companyId: "company-1",
  companyNumber: "12345678",
  companyName: "Example Limited",
  sourceFetchedAt: "2026-05-26T18:00:00.000Z",
  derivedStatus: "active",
  incorporatedOn: "2010-01-01",
  derivedCompanyAgeMonths: 196,
  latestAccountsDate: "2025-12-31",
  latestConfirmationStatementDate: "2026-01-31",
  sicCodes: ["62020"],
  accounts: [{ id: "accounts-1", periodEnd: "2025-12-31", netAssets: 100000 }],
  officers: [{ id: "officer-1", officerName: "A Director" }],
  charges: []
};

describe("mapScoreToRiskBand", () => {
  it("maps score thresholds to risk bands", () => {
    assert.equal(mapScoreToRiskBand(90, modelVersion), "very_low");
    assert.equal(mapScoreToRiskBand(70, modelVersion), "low");
    assert.equal(mapScoreToRiskBand(50, modelVersion), "moderate");
    assert.equal(mapScoreToRiskBand(30, modelVersion), "high");
    assert.equal(mapScoreToRiskBand(10, modelVersion), "very_high");
    assert.equal(mapScoreToRiskBand(null, modelVersion), "not_scored");
  });
});

describe("runCreditSharkScore", () => {
  it("applies hard-stop behaviour for dissolved companies", () => {
    const result = runCreditSharkScore({
      snapshot: { ...baseSnapshot, derivedStatus: "dissolved" },
      manualAdverseEvents: [],
      modelVersion
    });

    assert.equal(result.riskBand, "very_high");
    assert.equal(result.confidenceLevel, "insufficient");
    assert.equal(result.recommendedLimit, 0);
    assert.equal(result.manualOverrideState, "review_required");
    assert.equal(result.reasonCodes[0]?.code, "COMPANY_DISSOLVED");
  });

  it("returns reason codes with the required output shape", () => {
    const result = runCreditSharkScore({ snapshot: baseSnapshot, manualAdverseEvents: [], modelVersion });
    const reason = result.reasonCodes[0];

    assert.ok(reason);
    assert.equal(typeof reason.code, "string");
    assert.equal(typeof reason.label, "string");
    assert.equal(typeof reason.group, "string");
    assert.ok(["positive", "negative", "neutral", "missing"].includes(reason.direction));
    assert.equal(typeof reason.weight, "number");
    assert.equal(typeof reason.sourceType, "string");
    assert.equal(typeof reason.explanation, "string");
  });

  it("emits missing-data flags for unavailable financial metrics", () => {
    const result = runCreditSharkScore({
      snapshot: { ...baseSnapshot, accounts: [] },
      manualAdverseEvents: [],
      modelVersion
    });

    assert.ok(result.missingDataFlags.includes("financial_metrics_missing"));
    assert.ok(result.reasonCodes.some((reason) => reason.code === "FINANCIAL_METRICS_MISSING"));
    assert.equal(result.confidenceLevel, "low");
  });

  it("includes active manual adverse events in the score output", () => {
    const event: ManualAdverseEvent = {
      id: "event-1",
      companyId: "company-1",
      eventType: "ccj",
      eventDate: "2026-01-15",
      amount: 15000,
      currency: "GBP",
      status: "judgment",
      sourceNote: "Manual evidence",
      enteredBy: "tester",
      enteredAt: "2026-05-26T18:00:00.000Z",
      isActive: true
    };

    const result = runCreditSharkScore({ snapshot: baseSnapshot, manualAdverseEvents: [event], modelVersion });

    assert.equal(result.manualOverrideState, "manual_data_present");
    assert.ok(result.reasonCodes.some((reason) => reason.code === "MANUAL_ADVERSE_EVENTS_PRESENT"));
  });
});

