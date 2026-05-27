import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADVISORY_SCORE_LABEL,
  COMPANIES_HOUSE_EVIDENCE_LABEL,
  CREDITSHARK_FOOTER_DISCLAIMER,
  CREDITSHARK_REPORT_LIMITATIONS,
  LATEST_CHECK_LABEL,
  MANUAL_DATA_INCLUDED_LABEL,
  SCORE_HISTORY_LABEL,
  SOURCE_LINKED_EVIDENCE_LABEL,
  USER_ENTERED_RECORD_LABEL,
  USER_RECORDED_DECISION_LABEL
} from "../src/lib/guardrails.js";

describe("CreditShark guardrail copy", () => {
  it("uses the approved concise footer disclaimer", () => {
    assert.equal(
      CREDITSHARK_FOOTER_DISCLAIMER,
      "CreditShark provides advisory trade-risk screening for UK limited companies only. It does not provide consumer credit reports, regulated credit ratings, lending decisions, credit broking, debt advice or debt collection services."
    );
  });

  it("keeps report limitations separate from footer copy", () => {
    assert.notEqual(CREDITSHARK_REPORT_LIMITATIONS, CREDITSHARK_FOOTER_DISCLAIMER);
    assert.match(CREDITSHARK_REPORT_LIMITATIONS, /user-recorded commercial decision/);
    assert.match(CREDITSHARK_REPORT_LIMITATIONS, /model version/);
    assert.match(CREDITSHARK_REPORT_LIMITATIONS, /source timestamps/);
  });

  it("exports short contextual labels for app surfaces", () => {
    assert.equal(ADVISORY_SCORE_LABEL, "Advisory score");
    assert.equal(LATEST_CHECK_LABEL, "Latest CreditShark check");
    assert.equal(MANUAL_DATA_INCLUDED_LABEL, "Manual data included");
    assert.equal(USER_ENTERED_RECORD_LABEL, "User-entered record");
    assert.equal(USER_RECORDED_DECISION_LABEL, "User-recorded decision");
    assert.equal(SOURCE_LINKED_EVIDENCE_LABEL, "Source-linked evidence");
    assert.equal(COMPANIES_HOUSE_EVIDENCE_LABEL, "Companies House evidence");
    assert.equal(SCORE_HISTORY_LABEL, "Score history");
  });

  it("does not include secret-like values", () => {
    const allCopy = [
      CREDITSHARK_FOOTER_DISCLAIMER,
      CREDITSHARK_REPORT_LIMITATIONS,
      ADVISORY_SCORE_LABEL,
      LATEST_CHECK_LABEL,
      MANUAL_DATA_INCLUDED_LABEL,
      USER_ENTERED_RECORD_LABEL,
      USER_RECORDED_DECISION_LABEL,
      SOURCE_LINKED_EVIDENCE_LABEL,
      COMPANIES_HOUSE_EVIDENCE_LABEL,
      SCORE_HISTORY_LABEL
    ].join(" ");

    assert.equal(allCopy.includes("DATABASE_URL"), false);
    assert.equal(allCopy.includes("API_KEY"), false);
    assert.equal(allCopy.includes("SUPABASE"), false);
  });
});
