import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countPersistedCharges,
  mapManualAdverseEventRow,
  mapSnapshotEvidenceToScoreInput,
  validateScoreCompanyNumber,
  type SnapshotScoreEvidence
} from "../src/lib/scoring/snapshot-score-mapper.js";

const evidence: SnapshotScoreEvidence = {
  company: {
    id: "company-1",
    company_number: "00445790",
    company_name: "TESCO PLC",
    company_status: "active",
    company_type: "plc",
    incorporated_on: "1947-11-27",
    dissolved_on: null
  },
  snapshot: {
    id: "snapshot-1",
    company_id: "company-1",
    company_number: "00445790",
    source_fetched_at: "2026-05-26T20:00:00.000Z",
    derived_status: "active",
    derived_company_age_months: 941,
    latest_accounts_date: "2025-02-26",
    latest_confirmation_statement_date: "2025-06-18",
    missing_sections_json: [],
    raw_profile_json: {
      sic_codes: ["47110"],
      has_insolvency_history: false
    }
  },
  accounts: [],
  charges: [
    { id: "charge-1", status: "outstanding", created_on: "2020-01-01", satisfied_on: null },
    { id: "charge-2", status: "fully-satisfied", created_on: "2019-01-01", satisfied_on: "2021-01-01" }
  ],
  officers: [
    { id: "officer-1", officer_name: "A Director", officer_role: "director", appointed_on: "2020-01-01", resigned_on: null }
  ],
  pscs: []
};

describe("validateScoreCompanyNumber", () => {
  it("sanitises valid company numbers", () => {
    assert.equal(validateScoreCompanyNumber(" 00445790 "), "00445790");
    assert.equal(validateScoreCompanyNumber("sc-123456"), "SC123456");
    assert.equal(validateScoreCompanyNumber("not valid"), null);
  });
});

describe("mapSnapshotEvidenceToScoreInput", () => {
  it("maps persisted company status, age and evidence into engine input", () => {
    const input = mapSnapshotEvidenceToScoreInput(evidence);

    assert.equal(input.companyId, "company-1");
    assert.equal(input.companyNumber, "00445790");
    assert.equal(input.derivedStatus, "active");
    assert.equal(input.derivedCompanyAgeMonths, 941);
    assert.deepEqual(input.sicCodes, ["47110"]);
    assert.equal(input.charges?.length, 2);
    assert.equal(input.officers?.[0]?.officerName, "A Director");
  });

  it("keeps financials unavailable when no accounts rows exist", () => {
    const input = mapSnapshotEvidenceToScoreInput(evidence);

    assert.deepEqual(input.accounts, []);
  });

  it("carries missing sections into score input", () => {
    const input = mapSnapshotEvidenceToScoreInput({
      ...evidence,
      snapshot: { ...evidence.snapshot, missing_sections_json: ["pscs"] }
    });

    assert.deepEqual(input.missingSections, ["pscs"]);
  });
});

describe("countPersistedCharges", () => {
  it("counts active and satisfied persisted charges", () => {
    assert.deepEqual(countPersistedCharges(evidence.charges), { active: 1, satisfied: 1 });
  });
});

describe("mapManualAdverseEventRow", () => {
  it("maps active manual adverse event rows without losing source fields", () => {
    const mapped = mapManualAdverseEventRow({
      id: "event-1",
      company_id: "company-1",
      event_type: "ccj",
      event_date: "2026-01-02",
      amount: "12000.00",
      currency: "GBP",
      status: "judgment",
      source_note: "Manual evidence",
      evidence_reference: "internal-note-1",
      entered_by: "tester",
      entered_at: "2026-05-26T20:00:00.000Z",
      superseded_by_id: null,
      is_active: true
    });

    assert.equal(mapped.amount, 12000);
    assert.equal(mapped.evidenceReference, "internal-note-1");
    assert.equal(mapped.isActive, true);
  });
});
