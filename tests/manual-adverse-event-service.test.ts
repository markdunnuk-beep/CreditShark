import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateManualAdverseEventInput } from "../src/lib/adverse/manual-adverse-event-service.js";

describe("validateManualAdverseEventInput", () => {
  it("rejects blank source notes", () => {
    const result = validateManualAdverseEventInput({
      eventType: "adverse_note",
      status: "note_only",
      sourceNote: "   "
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.fieldErrors?.sourceNote !== undefined, true);
  });

  it("rejects unsupported event types and statuses", () => {
    const result = validateManualAdverseEventInput({
      eventType: "unsupported",
      status: "bad_status",
      sourceNote: "Internal note from finance team"
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.fieldErrors?.eventType !== undefined, true);
      assert.equal(result.error.fieldErrors?.status !== undefined, true);
    }
  });

  it("requires event date for CCJ and payment default entries", () => {
    const result = validateManualAdverseEventInput({
      eventType: "ccj",
      status: "unsatisfied",
      sourceNote: "Manual note from credit control review"
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.fieldErrors?.eventDate !== undefined, true);
  });

  it("allows optional amount and defaults currency to GBP", () => {
    const result = validateManualAdverseEventInput({
      eventType: "adverse_note",
      status: "note_only",
      sourceNote: "Internal manual note from finance team"
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.amount, null);
      assert.equal(result.data.currency, "GBP");
    }
  });

  it("rejects negative or non-numeric amounts", () => {
    const result = validateManualAdverseEventInput({
      eventType: "payment_default",
      eventDate: "2026-05-01",
      amount: "-1",
      status: "unknown",
      sourceNote: "Internal manual note from finance team"
    });

    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.fieldErrors?.amount !== undefined, true);
  });
});
