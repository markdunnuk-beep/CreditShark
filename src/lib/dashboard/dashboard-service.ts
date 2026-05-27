import { DatabaseConfigurationError, getDatabasePool } from "../db/client";
import { calculateScoreMovement, type ScoreMovementSummary } from "../history/score-history-service";
import { buildWatchlistSummaryFromItems, type WatchlistSummary } from "../watchlist/watchlist-service";
import type { ConfidenceLevel, RiskBand } from "../../types/creditshark";

export interface DashboardRecentCheck {
  company_number: string;
  company_name: string;
  score_run_id: string;
  score: number | null;
  risk_band: RiskBand;
  confidence_level: ConfidenceLevel;
  recommended_limit: number;
  currency: string;
  run_at: string;
  source_fetched_at: string;
}

export interface DashboardScoreMovement {
  company_number: string;
  company_name: string;
  latest_run_at: string;
  movement: ScoreMovementSummary;
}

export interface DashboardDecision {
  id: string;
  company_number: string;
  company_name: string;
  decision: string;
  decided_at: string;
  risk_band: RiskBand | null;
  score: number | null;
}

export interface DashboardReportExport {
  id: string;
  company_number: string;
  company_name: string;
  exported_at: string;
  score: number | null;
  risk_band: RiskBand | null;
  decision_record_id: string | null;
}

export interface DashboardMonitoringSummary {
  totalEvents: number;
  reviewEvents: number;
  materialEvents: number;
  latestDetectedAt: string | null;
}

export interface DashboardOverview {
  watchlistSummary: WatchlistSummary;
  recentChecks: DashboardRecentCheck[];
  scoreMovements: DashboardScoreMovement[];
  recentDecisions: DashboardDecision[];
  recentReportExports: DashboardReportExport[];
  monitoringSummary: DashboardMonitoringSummary;
}

export type DashboardServiceResult =
  | { ok: true; data: DashboardOverview }
  | { ok: false; error: DashboardServiceError };

export interface DashboardServiceError {
  code: "missing_database_url" | "database_error";
  message: string;
}

interface WatchlistSummaryRow {
  total_watched: string | number;
  high_or_very_high_risk_count: string | number;
  requiring_review_count: string | number;
  recently_checked_count: string | number;
  active_manual_adverse_event_count: string | number;
}

interface RecentCheckRow {
  company_number: string;
  company_name: string;
  score_run_id: string;
  score: number | null;
  risk_band: RiskBand;
  confidence_level: ConfidenceLevel;
  recommended_limit: string | number;
  currency: string;
  run_at: string;
  source_fetched_at: string;
}

interface MovementRow {
  company_number: string;
  company_name: string;
  score_run_id: string;
  score: number | null;
  risk_band: RiskBand;
  run_at: string;
  rank_number: string | number;
}

interface DecisionRow {
  id: string;
  company_number: string;
  company_name: string;
  decision: string;
  decided_at: string;
  risk_band: RiskBand | null;
  score: number | null;
}

interface ReportExportRow {
  id: string;
  company_number: string;
  company_name: string;
  exported_at: string;
  score: number | null;
  risk_band: RiskBand | null;
  decision_record_id: string | null;
}

interface MonitoringSummaryRow {
  total_events: string | number;
  review_events: string | number;
  material_events: string | number;
  latest_detected_at: string | null;
}

export async function getDashboardOverview(): Promise<DashboardServiceResult> {
  try {
    const pool = getDatabasePool();
    const [watchlist, recentChecks, movements, decisions, reports, monitoring] = await Promise.all([
      pool.query<WatchlistSummaryRow>(watchlistSummarySql()),
      pool.query<RecentCheckRow>(recentChecksSql(), [6]),
      pool.query<MovementRow>(scoreMovementsSql(), [6]),
      pool.query<DecisionRow>(recentDecisionsSql(), [5]),
      pool.query<ReportExportRow>(recentReportExportsSql(), [5]),
      pool.query<MonitoringSummaryRow>(monitoringSummarySql())
    ]);

    return {
      ok: true,
      data: buildDashboardOverview({
        watchlistSummary: watchlist.rows[0] ?? null,
        recentChecks: recentChecks.rows,
        movementRows: movements.rows,
        recentDecisions: decisions.rows,
        recentReportExports: reports.rows,
        monitoringSummary: monitoring.rows[0] ?? null
      })
    };
  } catch (error) {
    if (error instanceof DatabaseConfigurationError) {
      return { ok: false, error: { code: "missing_database_url", message: "Database connection is not configured on the server." } };
    }

    return { ok: false, error: { code: "database_error", message: "Dashboard overview could not be loaded." } };
  }
}

export function buildDashboardOverview(input: {
  watchlistSummary: WatchlistSummaryRow | null;
  recentChecks: RecentCheckRow[];
  movementRows: MovementRow[];
  recentDecisions: DecisionRow[];
  recentReportExports: ReportExportRow[];
  monitoringSummary: MonitoringSummaryRow | null;
}): DashboardOverview {
  return {
    watchlistSummary: input.watchlistSummary ? mapWatchlistSummary(input.watchlistSummary) : buildWatchlistSummaryFromItems([]),
    recentChecks: input.recentChecks.map(mapRecentCheck),
    scoreMovements: buildScoreMovements(input.movementRows),
    recentDecisions: input.recentDecisions.map((row) => ({ ...row })),
    recentReportExports: input.recentReportExports.map((row) => ({ ...row })),
    monitoringSummary: input.monitoringSummary ? mapMonitoringSummary(input.monitoringSummary) : {
      totalEvents: 0,
      reviewEvents: 0,
      materialEvents: 0,
      latestDetectedAt: null
    }
  };
}

export function formatDashboardMoney(value: number | null | undefined, currency = "GBP"): string {
  if (value == null) return "Not recorded";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function formatDashboardValue(value: string | null | undefined): string {
  return value ? value.replace(/_/g, " ") : "Not available";
}

function mapWatchlistSummary(row: WatchlistSummaryRow): WatchlistSummary {
  return {
    totalWatched: Number(row.total_watched),
    highOrVeryHighRiskCount: Number(row.high_or_very_high_risk_count),
    requiringReviewCount: Number(row.requiring_review_count),
    recentlyCheckedCount: Number(row.recently_checked_count),
    activeManualAdverseEventCount: Number(row.active_manual_adverse_event_count)
  };
}

function mapRecentCheck(row: RecentCheckRow): DashboardRecentCheck {
  return {
    ...row,
    recommended_limit: Number(row.recommended_limit)
  };
}

function buildScoreMovements(rows: MovementRow[]): DashboardScoreMovement[] {
  const grouped = new Map<string, MovementRow[]>();
  for (const row of rows) {
    grouped.set(row.company_number, [...(grouped.get(row.company_number) ?? []), row]);
  }

  return Array.from(grouped.values()).map((companyRows) => {
    const sorted = companyRows.sort((a, b) => Number(a.rank_number) - Number(b.rank_number));
    const latest = sorted[0] ?? null;
    const previous = sorted[1] ?? null;
    return {
      company_number: latest?.company_number ?? "",
      company_name: latest?.company_name ?? "",
      latest_run_at: latest?.run_at ?? "",
      movement: calculateScoreMovement(
        latest ? { score: latest.score, risk_band: latest.risk_band } : null,
        previous ? { score: previous.score, risk_band: previous.risk_band } : null
      )
    };
  }).filter((item) => item.company_number);
}

function mapMonitoringSummary(row: MonitoringSummaryRow): DashboardMonitoringSummary {
  return {
    totalEvents: Number(row.total_events),
    reviewEvents: Number(row.review_events),
    materialEvents: Number(row.material_events),
    latestDetectedAt: row.latest_detected_at
  };
}

function watchlistSummarySql(): string {
  return `
    with active_watchlist as (
      select watchlists.company_id, watchlists.last_checked_at
      from watchlists
      where watchlists.is_active = true
    ),
    latest_scores as (
      select distinct on (score_runs.company_id)
        score_runs.company_id,
        score_runs.risk_band,
        score_runs.run_at
      from score_runs
      order by score_runs.company_id, score_runs.run_at desc
    ),
    active_manual as (
      select company_id, count(*) as active_manual_count
      from manual_adverse_events
      where is_active = true and superseded_by_id is null
      group by company_id
    )
    select
      count(active_watchlist.company_id) as total_watched,
      count(*) filter (where latest_scores.risk_band in ('high', 'very_high')) as high_or_very_high_risk_count,
      count(*) filter (where latest_scores.risk_band in ('moderate', 'high', 'very_high') or coalesce(active_manual.active_manual_count, 0) > 0) as requiring_review_count,
      count(*) filter (where coalesce(latest_scores.run_at, active_watchlist.last_checked_at) >= now() - interval '7 days') as recently_checked_count,
      coalesce(sum(coalesce(active_manual.active_manual_count, 0)), 0) as active_manual_adverse_event_count
    from active_watchlist
    left join latest_scores on latest_scores.company_id = active_watchlist.company_id
    left join active_manual on active_manual.company_id = active_watchlist.company_id`;
}

function recentChecksSql(): string {
  return `
    with ranked as (
      select
        companies.company_number,
        companies.company_name,
        score_runs.id as score_run_id,
        score_runs.score,
        score_runs.risk_band,
        score_runs.confidence_level,
        score_runs.recommended_limit,
        score_runs.currency,
        score_runs.run_at::text,
        company_snapshots.source_fetched_at::text,
        row_number() over (partition by companies.id order by score_runs.run_at desc) as rank_number
      from score_runs
      join companies on companies.id = score_runs.company_id
      join company_snapshots on company_snapshots.id = score_runs.snapshot_id
    )
    select *
    from ranked
    where rank_number = 1
    order by run_at desc
    limit $1`;
}

function scoreMovementsSql(): string {
  return `
    with latest_companies as (
      select company_id, max(run_at) as latest_run
      from score_runs
      group by company_id
      order by latest_run desc
      limit $1
    ),
    ranked as (
      select
        companies.company_number,
        companies.company_name,
        score_runs.id as score_run_id,
        score_runs.score,
        score_runs.risk_band,
        score_runs.run_at::text,
        latest_companies.latest_run,
        row_number() over (partition by companies.id order by score_runs.run_at desc) as rank_number
      from score_runs
      join latest_companies on latest_companies.company_id = score_runs.company_id
      join companies on companies.id = score_runs.company_id
    )
    select company_number, company_name, score_run_id, score, risk_band, run_at, rank_number
    from ranked
    where rank_number <= 2
    order by latest_run desc, company_number asc, rank_number asc`;
}

function recentDecisionsSql(): string {
  return `
    select
      decision_records.id,
      companies.company_number,
      companies.company_name,
      decision_records.decision,
      decision_records.decided_at::text,
      score_runs.risk_band,
      score_runs.score
    from decision_records
    join companies on companies.id = decision_records.company_id
    left join score_runs on score_runs.id = decision_records.score_run_id
    order by decision_records.decided_at desc
    limit $1`;
}

function recentReportExportsSql(): string {
  return `
    select
      report_exports.id,
      companies.company_number,
      companies.company_name,
      report_exports.exported_at::text,
      score_runs.score,
      score_runs.risk_band,
      report_exports.decision_record_id
    from report_exports
    join companies on companies.id = report_exports.company_id
    left join score_runs on score_runs.id = report_exports.score_run_id
    order by report_exports.exported_at desc
    limit $1`;
}

function monitoringSummarySql(): string {
  return `
    select
      count(*) as total_events,
      count(*) filter (where severity = 'review') as review_events,
      count(*) filter (where severity = 'material') as material_events,
      max(detected_at)::text as latest_detected_at
    from monitoring_events`;
}
