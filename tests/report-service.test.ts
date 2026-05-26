import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildReportReasonSummaries,
  createReportExportAuditMetadata,
  REPORT_INCLUDED_SECTIONS
} from "../src/lib/reports/report-service.js";
import type { ScoreReasonCode } from "../src/types/creditshark.js";

const reasons: ScoreReasonCode[] = [
  {
    code: "ACTIVE_COMPANY",
    label: "Active company",
    group: "company_status",
    direction: "positive",
    weight: 10,
    impact: "medium",
    sourceType: "companies_house_profile",
    sourceDate: "2026-05-26",
    explanation: "The company is active."
  },
  {
    code: "FINANCIAL_METRICS_MISSING",
    label: "Financial metrics unavailable",
    group: "financial_strength",
    direction: "missing",
    weight: -8,
    impact: "material",
    sourceType: "company_accounts",
    explanation: "Structured financial metrics are unavailable."
  },
  {
    code: "ACTIVE_CHARGES_PRESENT",
    label: "Active charges present",
    group: "charges",
    direction: "negative",
    weight: -6,
    impact: "medium",
    sourceType: "company_charges",
    sourceDate: "2025-01-01",
    explanation: "Active charges are present."
  }
];

describe("REPORT_INCLUDED_SECTIONS", () => {
  it("includes the required report section names", () => {
    assert.deepEqual(REPORT_INCLUDED_SECTIONS, [
      "cover_summary",
      "decision_rationale",
      "company_identity",
      "filing_and_accounts",
      "charges_and_adverse_events",
      "directors_and_psc_summary",
      "limitations"
    ]);
  });
});

describe("buildReportReasonSummaries", () => {
  it("groups top positive, negative and missing reasons", () => {
    const summary = buildReportReasonSummaries(reasons);

    assert.equal(summary.topPositiveReasons[0]?.code, "ACTIVE_COMPANY");
    assert.equal(summary.topNegativeReasons[0]?.code, "ACTIVE_CHARGES_PRESENT");
    assert.equal(summary.missingReasons[0]?.code, "FINANCIAL_METRICS_MISSING");
  });

  it("counts active and satisfied charges and manual data", () => {
    const summary = buildReportReasonSummaries(
      reasons,
      [
        { id: "charge-1", charge_number: "1", status: "outstanding", created_on: "2025-01-01", satisfied_on: null, classification: null },
        { id: "charge-2", charge_number: "2", status: "fully-satisfied", created_on: "2024-01-01", satisfied_on: "2025-01-01", classification: null }
      ],
      [],
      [{
        id: "event-1",
        company_id: "company-1",
        event_type: "adverse_note",
        event_date: "2026-05-01",
        amount: null,
        currency: "GBP",
        status: "note_only",
        source_note: "Manual note",
        evidence_reference: null,
        entered_by: "tester",
        entered_at: "2026-05-26T10:00:00.000Z",
        updated_by: null,
        updated_at: null,
        superseded_by_id: null,
        is_active: true
      }]
    );

    assert.equal(summary.activeCharges, 1);
    assert.equal(summary.satisfiedCharges, 1);
    assert.equal(summary.latestChargeDate, "2025-01-01");
    assert.equal(summary.hasManualData, true);
  });
});

describe("createReportExportAuditMetadata", () => {
  it("contains report context without secret-like fields", () => {
    const metadata = createReportExportAuditMetadata({
      companyNumber: "00445790",
      reportExportId: "export-1",
      snapshotId: "snapshot-1",
      scoreRunId: "score-1",
      createdVia: "test"
    });

    assert.equal(metadata.company_number, "00445790");
    assert.equal(metadata.report_type, "trade_risk_report");
    assert.equal(JSON.stringify(metadata).includes("DATABASE_URL"), false);
    assert.equal(JSON.stringify(metadata).includes("API_KEY"), false);
  });
});
