import { sanitiseCompanyNumber } from "../companies/companies-house-normalisers";
import { DatabaseConfigurationError, getDatabasePool } from "../db/client";
import type { DecisionRecordValue, PersistedDecisionValue } from "../decisions/decision-service";
import type { ConfidenceLevel, ReasonDirection, RiskBand } from "../../types/creditshark";

export interface ScoreHistoryCompany {
  id: string;
  company_number: string;
  company_name: string;
}

export interface ScoreHistoryReasonSummary {
  label: string;
  direction: ReasonDirection;
  group: string;
  weight: number;
}

export interface ScoreHistoryDecisionSummary {
  id: string;
  decision: PersistedDecisionValue;
  decision_value: DecisionRecordValue;
  decided_at: string;
}

export interface ScoreHistoryReportSummary {
  latest_export_id: string | null;
  latest_exported_at: string | null;
  export_count: number;
}

export interface ScoreHistoryRow {
  score_run_id: string;
  snapshot_id: string;
  score: number | null;
  risk_band: RiskBand;
  confidence_level: ConfidenceLevel;
  recommended_limit: number;
  currency: string;
  model_version: string;
  run_at: string;
  source_fetched_at: string;
  top_positive_reason: ScoreHistoryReasonSummary | null;
  top_review_reason: ScoreHistoryReasonSummary | null;
  missing_data_flags: string[];
  decision: ScoreHistoryDecisionSummary | null;
  report: ScoreHistoryReportSummary;
  score_change_reason_summary: string | null;
  latest_source_event_summary: string | null;
}

export interface ScoreMovementSummary {
  kind: "none" | "increase" | "decrease" | "unchanged";
  latestScore: number | null;
  previousScore: number | null;
  delta: number | null;
  latestRiskBand: RiskBand | null;
  previousRiskBand: RiskBand | null;
  bandChanged: boolean;
  message: string;
  bandMessage: string | null;
}

export interface ScoreHistoryViewModel {
  company: ScoreHistoryCompany;
  rows: ScoreHistoryRow[];
  latest: ScoreHistoryRow | null;
  previous: ScoreHistoryRow | null;
  movement: ScoreMovementSummary;
}

export type ScoreHistoryServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ScoreHistoryServiceError };

export interface ScoreHistoryServiceError {
  code: "invalid_company_number" | "missing_database_url" | "company_not_found" | "database_error";
  message: string;
}

interface ScoreHistoryBaseRow {
  score_run_id: string;
  snapshot_id: string;
  score: number | null;
  risk_band: RiskBand;
  confidence_level: ConfidenceLevel;
  recommended_limit: string | number;
  currency: string;
  missing_data_flags_json: string[] | null;
  run_at: string;
  source_fetched_at: string;
  model_version: string;
}

interface ReasonRow {
  score_run_id: string;
  label: string;
  direction: ReasonDirection;
  group: string;
  weight: string | number;
  sort_order: number;
}

interface DecisionRow {
  id: string;
  score_run_id: string;
  decision: PersistedDecisionValue;
  decision_value: DecisionRecordValue;
  decided_at: string;
}

interface ReportRow {
  score_run_id: string;
  latest_export_id: string | null;
  latest_exported_at: string | null;
  export_count: string | number;
}

export async function getScoreHistoryForCompany(
  companyNumberInput: string,
  options: { limit?: number } = {}
): Promise<ScoreHistoryServiceResult<ScoreHistoryViewModel>> {
  const companyNumber = sanitiseCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);

  try {
    const pool = getDatabasePool();
    const companyResult = await pool.query<ScoreHistoryCompany>(
      `select id, company_number, company_name from companies where company_number = $1`,
      [companyNumber]
    );
    const company = companyResult.rows[0];
    if (!company) {
      return { ok: false, error: { code: "company_not_found", message: "Open the company profile before reviewing score history." } };
    }

    const baseResult = await pool.query<ScoreHistoryBaseRow>(
      `select
        score_runs.id as score_run_id,
        score_runs.snapshot_id,
        score_runs.score,
        score_runs.risk_band,
        score_runs.confidence_level,
        score_runs.recommended_limit,
        score_runs.currency,
        score_runs.missing_data_flags_json,
        score_runs.run_at::text,
        company_snapshots.source_fetched_at::text,
        scoring_model_versions.version as model_version
       from score_runs
       join company_snapshots on company_snapshots.id = score_runs.snapshot_id
       left join scoring_model_versions on scoring_model_versions.id = score_runs.model_version_id
       where score_runs.company_id = $1
       order by score_runs.run_at desc
       limit $2`,
      [company.id, limit]
    );

    const scoreRunIds = baseResult.rows.map((row) => row.score_run_id);
    const [reasonResult, decisionResult, reportResult] = scoreRunIds.length > 0
      ? await Promise.all([
        pool.query<ReasonRow>(
          `select score_run_id, label, direction, "group", weight, sort_order
           from score_reason_codes
           where score_run_id = any($1::uuid[])
           order by score_run_id, sort_order asc, created_at asc`,
          [scoreRunIds]
        ),
        pool.query<DecisionRow>(
          `select id, score_run_id, decision,
            case decision
              when 'approve' then 'approve_within_recommended_limit'
              when 'refer' then 'refer_for_review'
              else 'decline_or_prepayment_only'
            end as decision_value,
            decided_at::text
           from decision_records
           where score_run_id = any($1::uuid[])
           order by decided_at desc`,
          [scoreRunIds]
        ),
        pool.query<ReportRow>(
          `select
            score_run_id,
            (array_agg(id order by exported_at desc))[1] as latest_export_id,
            max(exported_at)::text as latest_exported_at,
            count(*) as export_count
           from report_exports
           where score_run_id = any($1::uuid[])
           group by score_run_id`,
          [scoreRunIds]
        )
      ])
      : [{ rows: [] as ReasonRow[] }, { rows: [] as DecisionRow[] }, { rows: [] as ReportRow[] }];

    const rows = buildScoreHistoryRows(baseResult.rows, reasonResult.rows, decisionResult.rows, reportResult.rows);

    return {
      ok: true,
      data: buildScoreHistoryViewModel(company, rows)
    };
  } catch (error) {
    return mapScoreHistoryError(error, "Score history could not be loaded.");
  }
}

export async function getScoreHistorySummary(companyNumberInput: string): Promise<ScoreHistoryServiceResult<ScoreHistoryViewModel>> {
  return getScoreHistoryForCompany(companyNumberInput, { limit: 2 });
}

export async function getLatestScoreMovement(companyNumberInput: string): Promise<ScoreHistoryServiceResult<ScoreMovementSummary>> {
  const result = await getScoreHistorySummary(companyNumberInput);
  if (!result.ok) return result;
  return { ok: true, data: result.data.movement };
}

export function buildScoreHistoryViewModel(
  company: ScoreHistoryCompany,
  rows: ScoreHistoryRow[]
): ScoreHistoryViewModel {
  const latest = rows[0] ?? null;
  const previous = rows[1] ?? null;
  return {
    company,
    rows,
    latest,
    previous,
    movement: calculateScoreMovement(latest, previous)
  };
}

export function buildScoreHistoryRows(
  baseRows: ScoreHistoryBaseRow[],
  reasons: ReasonRow[],
  decisions: DecisionRow[],
  reports: ReportRow[]
): ScoreHistoryRow[] {
  const reasonMap = new Map<string, ReasonRow[]>();
  for (const reason of reasons) {
    reasonMap.set(reason.score_run_id, [...(reasonMap.get(reason.score_run_id) ?? []), reason]);
  }

  const decisionMap = new Map<string, DecisionRow>();
  for (const decision of decisions) {
    if (!decisionMap.has(decision.score_run_id)) decisionMap.set(decision.score_run_id, decision);
  }

  const reportMap = new Map<string, ReportRow>();
  for (const report of reports) {
    reportMap.set(report.score_run_id, report);
  }

  return baseRows.map((row) => {
    const rowReasons = reasonMap.get(row.score_run_id) ?? [];
    const decision = decisionMap.get(row.score_run_id) ?? null;
    const report = reportMap.get(row.score_run_id) ?? null;
    return {
      score_run_id: row.score_run_id,
      snapshot_id: row.snapshot_id,
      score: row.score,
      risk_band: row.risk_band,
      confidence_level: row.confidence_level,
      recommended_limit: Number(row.recommended_limit),
      currency: row.currency,
      model_version: row.model_version ?? "Unknown",
      run_at: row.run_at,
      source_fetched_at: row.source_fetched_at,
      top_positive_reason: selectReasonSummary(rowReasons, "positive"),
      top_review_reason: selectReasonSummary(rowReasons, "review"),
      missing_data_flags: row.missing_data_flags_json ?? [],
      decision: decision
        ? {
          id: decision.id,
          score_run_id: decision.score_run_id,
          decision: decision.decision,
          decision_value: decision.decision_value,
          decided_at: decision.decided_at
        }
        : null,
      report: {
        latest_export_id: report?.latest_export_id ?? null,
        latest_exported_at: report?.latest_exported_at ?? null,
        export_count: Number(report?.export_count ?? 0)
      },
      score_change_reason_summary: summariseSourceReasons(rowReasons),
      latest_source_event_summary: null
    };
  });
}

export function calculateScoreMovement(
  latest: Pick<ScoreHistoryRow, "score" | "risk_band"> | null,
  previous: Pick<ScoreHistoryRow, "score" | "risk_band"> | null
): ScoreMovementSummary {
  if (!latest) {
    return {
      kind: "none",
      latestScore: null,
      previousScore: null,
      delta: null,
      latestRiskBand: null,
      previousRiskBand: null,
      bandChanged: false,
      message: "No score runs are available yet.",
      bandMessage: null
    };
  }

  if (!previous || latest.score == null || previous.score == null) {
    return {
      kind: "none",
      latestScore: latest.score,
      previousScore: previous?.score ?? null,
      delta: null,
      latestRiskBand: latest.risk_band,
      previousRiskBand: previous?.risk_band ?? null,
      bandChanged: false,
      message: "Only one score run available so far.",
      bandMessage: null
    };
  }

  const delta = latest.score - previous.score;
  const kind = delta > 0 ? "increase" : delta < 0 ? "decrease" : "unchanged";
  const bandChanged = latest.risk_band !== previous.risk_band;
  return {
    kind,
    latestScore: latest.score,
    previousScore: previous.score,
    delta,
    latestRiskBand: latest.risk_band,
    previousRiskBand: previous.risk_band,
    bandChanged,
    message: movementMessage(kind, delta),
    bandMessage: bandChanged ? `Risk band moved from ${formatHistoryValue(previous.risk_band)} to ${formatHistoryValue(latest.risk_band)}.` : null
  };
}

export function formatHistoryMoney(value: string | number | null | undefined, currency = "GBP"): string {
  if (value == null) return "Not recorded";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value));
}

export function formatHistoryValue(value: string | null | undefined): string {
  return value ? value.replace(/_/g, " ") : "Not available";
}

function selectReasonSummary(reasons: ReasonRow[], mode: "positive" | "review"): ScoreHistoryReasonSummary | null {
  const reason = mode === "positive"
    ? reasons.find((item) => item.direction === "positive")
    : reasons.find((item) => item.direction === "negative" || item.direction === "missing" || item.direction === "neutral");

  return reason
    ? {
      label: reason.label,
      direction: reason.direction,
      group: reason.group,
      weight: Number(reason.weight)
    }
    : null;
}

function summariseSourceReasons(reasons: ReasonRow[]): string | null {
  const reviewReason = selectReasonSummary(reasons, "review");
  const positiveReason = selectReasonSummary(reasons, "positive");
  return reviewReason?.label ?? positiveReason?.label ?? null;
}

function movementMessage(kind: ScoreMovementSummary["kind"], delta: number): string {
  if (kind === "increase") return `Score increased by ${delta} point${delta === 1 ? "" : "s"} since the previous check.`;
  if (kind === "decrease") return `Score decreased by ${Math.abs(delta)} point${Math.abs(delta) === 1 ? "" : "s"} since the previous check.`;
  return "Score is unchanged since the previous check.";
}

function mapScoreHistoryError<T>(error: unknown, message: string): ScoreHistoryServiceResult<T> {
  if (error instanceof DatabaseConfigurationError) {
    return { ok: false, error: { code: "missing_database_url", message: "Database connection is not configured on the server." } };
  }

  return { ok: false, error: { code: "database_error", message } };
}
