import crypto from "node:crypto";
import { sanitiseCompanyNumber } from "../companies/companies-house-normalisers";
import { DatabaseConfigurationError, getDatabasePool } from "../db/client";
import type { ManualAdverseEventRecord } from "../adverse/manual-adverse-event-service";
import type { DecisionRecordValue, PersistedDecisionValue } from "../decisions/decision-service";
import { getScoreHistorySummary, type ScoreMovementSummary } from "../history/score-history-service";
import type { ConfidenceLevel, ReasonDirection, RiskBand, ScoreReasonCode } from "../../types/creditshark";

export const REPORT_INCLUDED_SECTIONS = [
  "cover_summary",
  "decision_rationale",
  "company_identity",
  "filing_and_accounts",
  "charges_and_adverse_events",
  "directors_and_psc_summary",
  "limitations"
] as const;

export type ReportIncludedSection = typeof REPORT_INCLUDED_SECTIONS[number];

export interface ReportCompany {
  id: string;
  company_number: string;
  company_name: string;
  company_status: string | null;
  company_type: string | null;
  jurisdiction: string | null;
  registered_office_postcode: string | null;
  incorporated_on: string | null;
  dissolved_on: string | null;
}

export interface ReportSnapshot {
  id: string;
  company_id: string;
  company_number: string;
  source_fetched_at: string;
  derived_status: string | null;
  derived_company_age_months: number | null;
  latest_accounts_date: string | null;
  latest_confirmation_statement_date: string | null;
  missing_sections_json: string[];
  raw_profile_json: {
    registered_office_address?: {
      locality?: string;
      postal_code?: string;
    };
  } | null;
}

export interface ReportScoreRun {
  id: string;
  company_id: string;
  snapshot_id: string;
  model_version_id: string;
  score: number | null;
  risk_band: RiskBand;
  confidence_level: ConfidenceLevel;
  recommended_limit: string | number;
  currency: string;
  manual_override_state: string;
  missing_data_flags_json: string[];
  run_at: string;
}

export interface ReportRecommendation {
  id: string;
  recommended_limit: string | number;
  currency: string;
  basis: string;
  limit_cap_reason: string | null;
}

export interface ReportDecision {
  id: string;
  score_run_id: string;
  credit_recommendation_id: string | null;
  decision: PersistedDecisionValue;
  decision_value: DecisionRecordValue;
  requested_limit: string | number | null;
  recommended_limit: string | number | null;
  approved_limit: string | number | null;
  currency: string;
  reviewer_notes: string;
  override_reason: string | null;
  decided_at: string;
}

export interface ReportFiling {
  id: string;
  filing_type: string | null;
  description: string | null;
  filing_date: string | null;
  made_up_date: string | null;
  category: string | null;
}

export interface ReportCharge {
  id: string;
  charge_number: string | null;
  status: string | null;
  created_on: string | null;
  satisfied_on: string | null;
  classification: string | null;
}

export interface ReportExportRecord {
  id: string;
  company_id: string;
  snapshot_id: string;
  score_run_id: string;
  decision_record_id: string | null;
  report_type: "trade_risk_report";
  file_path: string | null;
  file_hash: string | null;
  exported_by: string;
  exported_at: string;
  included_sections_json: ReportIncludedSection[];
}

export interface ReportViewModel {
  company: ReportCompany;
  snapshot: ReportSnapshot;
  scoreRun: ReportScoreRun;
  reasonCodes: ScoreReasonCode[];
  recommendation: ReportRecommendation | null;
  latestDecision: ReportDecision | null;
  scoreHistoryMovement: ScoreMovementSummary | null;
  modelVersion: { id: string; version: string; change_note: string };
  filings: ReportFiling[];
  charges: ReportCharge[];
  activeManualEvents: ManualAdverseEventRecord[];
  inactiveManualEventCount: number;
  officerSummary: { total: number; current: number };
  pscSummary: { total: number; active: number };
  generatedAt: string;
  exportRecord: ReportExportRecord | null;
  summaries: {
    topPositiveReasons: ScoreReasonCode[];
    topNegativeReasons: ScoreReasonCode[];
    missingReasons: ScoreReasonCode[];
    activeCharges: number;
    satisfiedCharges: number;
    latestChargeDate: string | null;
    latestFilingDate: string | null;
    hasManualData: boolean;
  };
}

export type ReportServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ReportServiceError };

export interface ReportServiceError {
  code: "invalid_company_number" | "missing_database_url" | "company_not_found" | "snapshot_not_found" | "score_run_not_found" | "database_error";
  message: string;
}

export interface CreateReportExportInput {
  companyNumber: string;
  actorId?: string | null;
  createdVia?: string;
}

export async function getLatestReportDataForCompany(companyNumberInput: string, exportId?: string | null): Promise<ReportServiceResult<ReportViewModel>> {
  const companyNumber = sanitiseCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  try {
    const pool = getDatabasePool();
    const companyResult = await pool.query<ReportCompany>(
      `select id, company_number, company_name, company_status, company_type, jurisdiction,
        registered_office_postcode, incorporated_on::text, dissolved_on::text
       from companies where company_number = $1`,
      [companyNumber]
    );
    const company = companyResult.rows[0];
    if (!company) return { ok: false, error: { code: "company_not_found", message: "Open the company profile and run an advisory score before exporting a report." } };

    const scoreRunResult = await pool.query<ReportScoreRun>(
      `select id, company_id, snapshot_id, model_version_id, score, risk_band, confidence_level,
        recommended_limit, currency, manual_override_state, missing_data_flags_json, run_at::text
       from score_runs
       where company_id = $1
       order by run_at desc
       limit 1`,
      [company.id]
    );
    const scoreRun = scoreRunResult.rows[0];
    if (!scoreRun) return { ok: false, error: { code: "score_run_not_found", message: "Open the company profile and run an advisory score before exporting a report." } };

    const [
      snapshotResult,
      reasonResult,
      recommendationResult,
      modelResult,
      filingResult,
      chargeResult,
      manualResult,
      officerResult,
      pscResult,
      decisionResult,
      exportResult
    ] = await Promise.all([
      pool.query<ReportSnapshot>(
        `select id, company_id, company_number, source_fetched_at::text, derived_status,
          derived_company_age_months, latest_accounts_date::text, latest_confirmation_statement_date::text,
          missing_sections_json, raw_profile_json
         from company_snapshots where id = $1`,
        [scoreRun.snapshot_id]
      ),
      pool.query<{
        code: string;
        label: string;
        group: string;
        direction: ReasonDirection;
        weight: string | number;
        impact: ScoreReasonCode["impact"];
        source_type: string;
        source_id: string | null;
        source_date: string | null;
        explanation: string;
      }>(
        `select code, label, "group", direction, weight, impact, source_type, source_id,
          source_date::text, explanation
         from score_reason_codes
         where score_run_id = $1
         order by sort_order asc, created_at asc`,
        [scoreRun.id]
      ),
      pool.query<ReportRecommendation>(
        `select id, recommended_limit, currency, basis, limit_cap_reason
         from credit_recommendations
         where score_run_id = $1
         order by created_at desc
         limit 1`,
        [scoreRun.id]
      ),
      pool.query<{ id: string; version: string; change_note: string }>(
        `select id, version, change_note from scoring_model_versions where id = $1`,
        [scoreRun.model_version_id]
      ),
      pool.query<ReportFiling>(
        `select id, filing_type, description, filing_date::text, made_up_date::text, category
         from company_filings
         where snapshot_id = $1
         order by filing_date desc nulls last
         limit 20`,
        [scoreRun.snapshot_id]
      ),
      pool.query<ReportCharge>(
        `select id, charge_number, status, created_on::text, satisfied_on::text, classification
         from company_charges
         where snapshot_id = $1
         order by created_on desc nulls last`,
        [scoreRun.snapshot_id]
      ),
      pool.query<ManualAdverseEventRecord>(
        `select id, company_id, event_type, event_date::text, amount, currency, status,
          source_note, evidence_reference, entered_by, entered_at::text, updated_by,
          updated_at::text, superseded_by_id, is_active
         from manual_adverse_events
         where company_id = $1
         order by is_active desc, event_date desc, entered_at desc`,
        [company.id]
      ),
      pool.query<{ total: string | number; current: string | number }>(
        `select count(*) as total, count(*) filter (where resigned_on is null) as current
         from company_officers where snapshot_id = $1`,
        [scoreRun.snapshot_id]
      ),
      pool.query<{ total: string | number; active: string | number }>(
        `select count(*) as total, count(*) filter (where ceased_on is null) as active
         from company_pscs where snapshot_id = $1`,
        [scoreRun.snapshot_id]
      ),
      pool.query<ReportDecision>(
        `select
          decision_records.id,
          decision_records.score_run_id,
          decision_records.credit_recommendation_id,
          decision_records.decision,
          case decision_records.decision
            when 'approve' then 'approve_within_recommended_limit'
            when 'refer' then 'refer_for_review'
            else 'decline_or_prepayment_only'
          end as decision_value,
          decision_records.requested_limit,
          credit_recommendations.recommended_limit,
          decision_records.approved_limit,
          decision_records.currency,
          decision_records.reviewer_notes,
          decision_records.override_reason,
          decision_records.decided_at::text
         from decision_records
         left join credit_recommendations on credit_recommendations.id = decision_records.credit_recommendation_id
         where decision_records.company_id = $1
         order by decision_records.decided_at desc
         limit 1`,
        [company.id]
      ),
      exportId
        ? pool.query<ReportExportRecord>(
          `select id, company_id, snapshot_id, score_run_id, decision_record_id, report_type, file_path, file_hash,
            exported_by, exported_at::text, included_sections_json
           from report_exports where id = $1 and company_id = $2`,
          [exportId, company.id]
        )
        : Promise.resolve({ rows: [] as ReportExportRecord[] })
    ]);

    const snapshot = snapshotResult.rows[0];
    if (!snapshot) return { ok: false, error: { code: "snapshot_not_found", message: "The latest score run does not have a readable snapshot." } };

    const reasonCodes = reasonResult.rows.map((reason) => ({
      code: reason.code,
      label: reason.label,
      group: reason.group,
      direction: reason.direction,
      weight: Number(reason.weight),
      impact: reason.impact,
      sourceType: reason.source_type,
      sourceId: reason.source_id ?? undefined,
      sourceDate: reason.source_date ?? undefined,
      explanation: reason.explanation
    }));

    const historyResult = await getScoreHistorySummary(company.company_number);

    return {
      ok: true,
      data: buildReportViewModel({
        company,
        snapshot,
        scoreRun,
        reasonCodes,
        recommendation: recommendationResult.rows[0] ?? null,
        latestDecision: decisionResult.rows[0] ?? null,
        scoreHistoryMovement: historyResult.ok ? historyResult.data.movement : null,
        modelVersion: modelResult.rows[0] ?? { id: scoreRun.model_version_id, version: "Unknown", change_note: "Not available" },
        filings: filingResult.rows,
        charges: chargeResult.rows,
        manualEvents: manualResult.rows,
        officerSummary: {
          total: Number(officerResult.rows[0]?.total ?? 0),
          current: Number(officerResult.rows[0]?.current ?? 0)
        },
        pscSummary: {
          total: Number(pscResult.rows[0]?.total ?? 0),
          active: Number(pscResult.rows[0]?.active ?? 0)
        },
        exportRecord: exportResult.rows[0] ?? null
      })
    };
  } catch (error) {
    return mapReportError(error, "Report data could not be loaded.");
  }
}

export async function createReportExportRecord(input: CreateReportExportInput): Promise<ReportServiceResult<ReportExportRecord>> {
  const reportData = await getLatestReportDataForCompany(input.companyNumber);
  if (!reportData.ok) return reportData;

  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      await client.query("begin");
      const fileHash = hashReportContext(reportData.data);
      const decisionRecordId = reportData.data.latestDecision?.score_run_id === reportData.data.scoreRun.id
        ? reportData.data.latestDecision.id
        : null;
      const exportResult = await client.query<ReportExportRecord>(
        `insert into report_exports (
          company_id, snapshot_id, score_run_id, decision_record_id, report_type,
          file_path, file_hash, exported_by, included_sections_json
        ) values ($1, $2, $3, $4, $5, null, $6, $7, $8)
        returning id, company_id, snapshot_id, score_run_id, decision_record_id, report_type, file_path,
          file_hash, exported_by, exported_at::text, included_sections_json`,
        [
          reportData.data.company.id,
          reportData.data.snapshot.id,
          reportData.data.scoreRun.id,
          decisionRecordId,
          "trade_risk_report",
          fileHash,
          input.actorId ?? "anonymous_user",
          JSON.stringify(REPORT_INCLUDED_SECTIONS)
        ]
      );
      const record = exportResult.rows[0]!;
      await client.query(
        `insert into audit_events (
          actor_id, actor_type, event_type, entity_type, entity_id, company_id, metadata_json
        ) values ($1, $2, $3, $4, $5, $6, $7)`,
        [
          input.actorId ?? null,
          input.actorId ? "user" : "anonymous_user",
          "report.exported",
          "report_export",
          record.id,
          reportData.data.company.id,
          JSON.stringify(createReportExportAuditMetadata({
            companyNumber: reportData.data.company.company_number,
            reportExportId: record.id,
            snapshotId: reportData.data.snapshot.id,
            scoreRunId: reportData.data.scoreRun.id,
            decisionRecordId,
            createdVia: input.createdVia ?? "report_service"
          }))
        ]
      );
      await client.query("commit");
      return { ok: true, data: record };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return mapReportError(error, "Report export record could not be created.");
  }
}

export async function getReportExportRecord(exportId: string): Promise<ReportServiceResult<ReportExportRecord>> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<ReportExportRecord>(
      `select id, company_id, snapshot_id, score_run_id, decision_record_id, report_type, file_path, file_hash,
        exported_by, exported_at::text, included_sections_json
       from report_exports where id = $1`,
      [exportId]
    );
    const row = result.rows[0];
    if (!row) return { ok: false, error: { code: "database_error", message: "Report export record was not found." } };
    return { ok: true, data: row };
  } catch (error) {
    return mapReportError(error, "Report export record could not be loaded.");
  }
}

export function buildReportViewModel(input: {
  company: ReportCompany;
  snapshot: ReportSnapshot;
  scoreRun: ReportScoreRun;
  reasonCodes: ScoreReasonCode[];
  recommendation: ReportRecommendation | null;
  latestDecision: ReportDecision | null;
  scoreHistoryMovement: ScoreMovementSummary | null;
  modelVersion: { id: string; version: string; change_note: string };
  filings: ReportFiling[];
  charges: ReportCharge[];
  manualEvents: ManualAdverseEventRecord[];
  officerSummary: { total: number; current: number };
  pscSummary: { total: number; active: number };
  exportRecord: ReportExportRecord | null;
}): ReportViewModel {
  return {
    ...input,
    activeManualEvents: input.manualEvents.filter((event) => event.is_active && !event.superseded_by_id),
    inactiveManualEventCount: input.manualEvents.filter((event) => !event.is_active || event.superseded_by_id).length,
    generatedAt: new Date().toISOString(),
    summaries: buildReportReasonSummaries(input.reasonCodes, input.charges, input.filings, input.manualEvents)
  };
}

export function buildReportReasonSummaries(
  reasonCodes: ScoreReasonCode[],
  charges: ReportCharge[] = [],
  filings: ReportFiling[] = [],
  manualEvents: ManualAdverseEventRecord[] = []
): ReportViewModel["summaries"] {
  const activeCharges = charges.filter((charge) => !(charge.status ?? "").toLowerCase().includes("satisfied")).length;
  const satisfiedCharges = charges.length - activeCharges;
  return {
    topPositiveReasons: reasonCodes.filter((reason) => reason.direction === "positive").slice(0, 3),
    topNegativeReasons: reasonCodes.filter((reason) => reason.direction === "negative").slice(0, 3),
    missingReasons: reasonCodes.filter((reason) => reason.direction === "missing"),
    activeCharges,
    satisfiedCharges,
    latestChargeDate: charges[0]?.created_on ?? null,
    latestFilingDate: filings[0]?.filing_date ?? null,
    hasManualData: manualEvents.some((event) => event.is_active && !event.superseded_by_id)
  };
}

export function createReportExportAuditMetadata(input: {
  companyNumber: string;
  reportExportId: string;
  snapshotId: string;
  scoreRunId: string;
  decisionRecordId?: string | null;
  createdVia: string;
}): Record<string, unknown> {
  return {
    company_number: input.companyNumber,
    report_export_id: input.reportExportId,
    snapshot_id: input.snapshotId,
    score_run_id: input.scoreRunId,
    decision_record_id: input.decisionRecordId ?? null,
    report_type: "trade_risk_report",
    included_sections: REPORT_INCLUDED_SECTIONS,
    created_via: input.createdVia
  };
}

function hashReportContext(report: ReportViewModel): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({
      company_number: report.company.company_number,
      snapshot_id: report.snapshot.id,
      score_run_id: report.scoreRun.id,
      decision_record_id: report.latestDecision?.id ?? null,
      model_version: report.modelVersion.version,
      included_sections: REPORT_INCLUDED_SECTIONS
    }))
    .digest("hex");
}

function mapReportError<T>(error: unknown, message: string): ReportServiceResult<T> {
  if (error instanceof DatabaseConfigurationError) {
    return { ok: false, error: { code: "missing_database_url", message: "Database connection is not configured on the server." } };
  }

  return { ok: false, error: { code: "database_error", message } };
}
