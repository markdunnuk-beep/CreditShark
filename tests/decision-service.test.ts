import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createDecisionAuditMetadata,
  formatDecisionMoney,
  validateDecisionInput
} from "../src/lib/decisions/decision-service.js";

const recommendation = {
  recommended_limit: 1000
};

const scoreRun = {
  risk_band: "moderate" as const,
  recommended_limit: 1000
};

describe("decision service validation", () => {
  it("rejects missing decision", () => {
    const result = validateDecisionInput({ decision: "", reviewer_notes: "Reviewed evidence." }, recommendation, scoreRun);

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.fieldErrors?.decision, "Choose a supported user-recorded decision.");
  });

  it("rejects negative limits", () => {
    const result = validateDecisionInput({
      decision: "refer_for_review",
      requested_limit: -1,
      reviewer_notes: "Reviewed evidence."
    }, recommendation, scoreRun);

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.fieldErrors?.requested_limit, "Requested limit must be numeric and non-negative.");
  });

  it("requires approved limit for approval", () => {
    const result = validateDecisionInput({
      decision: "approve_within_recommended_limit",
      reviewer_notes: "Reviewed evidence."
    }, recommendation, scoreRun);

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.fieldErrors?.approved_limit, "Final approved limit is required when recording an approval.");
  });

  it("requires reviewer notes", () => {
    const result = validateDecisionInput({
      decision: "refer_for_review"
    }, recommendation, scoreRun);

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.fieldErrors?.reviewer_notes, "Reviewer notes are required.");
  });

  it("requires override reason when approved limit exceeds recommendation", () => {
    const result = validateDecisionInput({
      decision: "approve_within_recommended_limit",
      approved_limit: 1500,
      reviewer_notes: "Reviewed evidence."
    }, recommendation, scoreRun);

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.fieldErrors?.override_reason, "Override reason is required when the recorded decision goes outside the recommendation.");
  });

  it("does not require override reason when approved limit is within recommendation", () => {
    const result = validateDecisionInput({
      decision: "approve_within_recommended_limit",
      requested_limit: 1000,
      approved_limit: 1000,
      reviewer_notes: "Reviewed evidence."
    }, recommendation, scoreRun);

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.overrideRequired, false);
      assert.equal(result.data.persistedDecision, "approve");
    }
  });

  it("audit metadata excludes reviewer notes and secret-like fields", () => {
    const metadata = createDecisionAuditMetadata({
      companyNumber: "00445790",
      decisionRecordId: "decision-id",
      scoreRunId: "score-id",
      creditRecommendationId: "recommendation-id",
      decision: "refer_for_review",
      requestedLimit: 1000,
      approvedLimit: null,
      currency: "GBP",
      overridePresent: false,
      createdVia: "test"
    });

    const encoded = JSON.stringify(metadata);
    assert.equal("reviewer_notes" in metadata, false);
    assert.doesNotMatch(encoded, /DATABASE_URL|API_KEY|Authorization|secret/i);
  });

  it("formats limits consistently", () => {
    assert.equal(formatDecisionMoney(1000, "GBP"), "£1,000");
    assert.equal(formatDecisionMoney(null, "GBP"), "Not recorded");
  });
});
