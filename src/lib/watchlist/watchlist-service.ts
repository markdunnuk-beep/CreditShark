import type pg from "pg";
import { sanitiseCompanyNumber } from "../companies/companies-house-normalisers";
import { DatabaseConfigurationError, getDatabasePool } from "../db/client";
import { getScoreHistorySummary, type ScoreMovementSummary } from "../history/score-history-service";
import type { ConfidenceLevel, RiskBand } from "../../types/creditshark";

export interface WatchlistCompany {
  id: string;
  company_number: string;
  company_name: string;
}

export interface WatchlistItem {
  id: string;
  company_id: string;
  added_by: string | null;
  added_at: string;
  is_active: boolean;
  removed_by: string | null;
  removed_at: string | null;
  watch_reason: string | null;
  last_checked_at: string | null;
}

export interface WatchlistCompanyContext {
  watchlist: WatchlistItem;
  company: WatchlistCompany;
  latestScore: {
    score_run_id: string;
    snapshot_id: string;
    score: number | null;
    risk_band: RiskBand;
    confidence_level: ConfidenceLevel;
    recommended_limit: number;
    currency: string;
    run_at: string;
    source_fetched_at: string;
  } | null;
  latestDecision: {
    id: string;
    decision: string;
    decided_at: string;
  } | null;
  latestReport: {
    id: string;
    exported_at: string;
  } | null;
  scoreMovement: ScoreMovementSummary;
  activeManualAdverseEventCount: number;
}

export interface WatchlistSummary {
  totalWatched: number;
  highOrVeryHighRiskCount: number;
  requiringReviewCount: number;
  recentlyCheckedCount: number;
  activeManualAdverseEventCount: number;
}

export type WatchlistServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: WatchlistServiceError };

export interface WatchlistServiceError {
  code: "invalid_company_number" | "missing_database_url" | "company_not_found" | "not_watched" | "database_error";
  message: string;
}

export interface WatchlistServiceOptions {
  actorId?: string | null;
  createdVia?: string;
}

interface WatchlistContextRow {
  watchlist_id: string;
  company_id: string;
  added_by: string | null;
  added_at: string;
  is_active: boolean;
  removed_by: string | null;
  removed_at: string | null;
  watch_reason: string | null;
  last_checked_at: string | null;
  company_number: string;
  company_name: string;
  score_run_id: string | null;
  snapshot_id: string | null;
  score: number | null;
  risk_band: RiskBand | null;
  confidence_level: ConfidenceLevel | null;
  recommended_limit: string | number | null;
  currency: string | null;
  run_at: string | null;
  source_fetched_at: string | null;
  decision_id: string | null;
  decision: string | null;
  decided_at: string | null;
  report_id: string | null;
  exported_at: string | null;
  active_manual_adverse_count: string | number;
}

export async function getWatchlist(): Promise<WatchlistServiceResult<{
  items: WatchlistCompanyContext[];
  summary: WatchlistSummary;
}>> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<WatchlistContextRow>(watchlistContextSql(), []);
    const items = await buildContexts(result.rows);
    return { ok: true, data: { items, summary: buildWatchlistSummaryFromItems(items) } };
  } catch (error) {
    return mapWatchlistError(error, "Watchlist could not be loaded.");
  }
}

export async function getWatchlistSummary(): Promise<WatchlistServiceResult<WatchlistSummary>> {
  const result = await getWatchlist();
  if (!result.ok) return result;
  return { ok: true, data: result.data.summary };
}

export async function getWatchlistItemForCompany(companyNumberInput: string): Promise<WatchlistServiceResult<{
  company: WatchlistCompany;
  watchlist: WatchlistItem | null;
}>> {
  const companyNumber = sanitiseCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  try {
    const pool = getDatabasePool();
    const result = await pool.query<WatchlistCompany & {
      watchlist_id: string | null;
      added_by: string | null;
      added_at: string | null;
      is_active: boolean | null;
      removed_by: string | null;
      removed_at: string | null;
      watch_reason: string | null;
      last_checked_at: string | null;
    }>(
      `select companies.id, companies.company_number, companies.company_name,
        watchlists.id as watchlist_id, watchlists.added_by, watchlists.added_at::text,
        watchlists.is_active, watchlists.removed_by, watchlists.removed_at::text,
        watchlists.watch_reason, watchlists.last_checked_at::text
       from companies
       left join watchlists on watchlists.company_id = companies.id and watchlists.is_active = true
       where companies.company_number = $1
       limit 1`,
      [companyNumber]
    );

    const row = result.rows[0];
    if (!row) {
      return { ok: false, error: { code: "company_not_found", message: "Open/check this company before adding it to the watchlist." } };
    }

    return {
      ok: true,
      data: {
        company: { id: row.id, company_number: row.company_number, company_name: row.company_name },
        watchlist: row.watchlist_id
          ? {
            id: row.watchlist_id,
            company_id: row.id,
            added_by: row.added_by,
            added_at: row.added_at ?? "",
            is_active: row.is_active ?? true,
            removed_by: row.removed_by,
            removed_at: row.removed_at,
            watch_reason: row.watch_reason,
            last_checked_at: row.last_checked_at
          }
          : null
      }
    };
  } catch (error) {
    return mapWatchlistError(error, "Watchlist status could not be loaded.");
  }
}

export async function getWatchlistCompanyContext(companyNumberInput: string): Promise<WatchlistServiceResult<WatchlistCompanyContext | null>> {
  const companyNumber = sanitiseCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  try {
    const pool = getDatabasePool();
    const result = await pool.query<WatchlistContextRow>(
      `${watchlistContextSql()} and companies.company_number = $1`,
      [companyNumber]
    );
    const context = (await buildContexts(result.rows))[0] ?? null;
    return { ok: true, data: context };
  } catch (error) {
    return mapWatchlistError(error, "Watchlist context could not be loaded.");
  }
}

export async function addCompanyToWatchlist(
  companyNumberInput: string,
  input: { watchReason?: string | null } = {},
  options: WatchlistServiceOptions = {}
): Promise<WatchlistServiceResult<WatchlistItem>> {
  const companyNumber = sanitiseCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  const watchReason = normaliseWatchReason(input.watchReason);

  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      await client.query("begin");
      const company = await loadCompany(client, companyNumber);
      if (!company) {
        await client.query("rollback");
        return { ok: false, error: { code: "company_not_found", message: "Open/check this company before adding it to the watchlist." } };
      }

      const existing = await loadActiveWatchlistItem(client, company.id);
      if (existing) {
        await client.query("commit");
        return { ok: true, data: existing };
      }

      const removed = await loadLatestRemovedWatchlistItem(client, company.id);
      const item = removed
        ? await reactivateWatchlistItem(client, removed.id, watchReason, options.actorId ?? null)
        : await insertWatchlistItem(client, company.id, watchReason, options.actorId ?? null);
      await insertWatchlistAuditEvent(client, "watchlist.added", company, item, options);
      await client.query("commit");
      return { ok: true, data: item };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return mapWatchlistError(error, "Company could not be added to the watchlist.");
  }
}

export async function removeCompanyFromWatchlist(
  companyNumberInput: string,
  options: WatchlistServiceOptions = {}
): Promise<WatchlistServiceResult<WatchlistItem>> {
  const companyNumber = sanitiseCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      await client.query("begin");
      const company = await loadCompany(client, companyNumber);
      if (!company) {
        await client.query("rollback");
        return { ok: false, error: { code: "company_not_found", message: "Open/check this company before changing watchlist status." } };
      }

      const existing = await loadActiveWatchlistItem(client, company.id);
      if (!existing) {
        await client.query("rollback");
        return { ok: false, error: { code: "not_watched", message: "This company is not currently on the watchlist." } };
      }

      const removed = await deactivateWatchlistItem(client, existing.id, options.actorId ?? null);
      await insertWatchlistAuditEvent(client, "watchlist.removed", company, removed, options);
      await client.query("commit");
      return { ok: true, data: removed };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return mapWatchlistError(error, "Company could not be removed from the watchlist.");
  }
}

export function createWatchlistAuditMetadata(input: {
  companyNumber: string;
  watchlistId: string;
  watchReasonPresent: boolean;
  createdVia: string;
}): Record<string, unknown> {
  return {
    company_number: input.companyNumber,
    watchlist_id: input.watchlistId,
    watch_reason_present: input.watchReasonPresent,
    created_via: input.createdVia
  };
}

export function buildWatchlistSummaryFromItems(items: WatchlistCompanyContext[]): WatchlistSummary {
  return {
    totalWatched: items.length,
    highOrVeryHighRiskCount: items.filter((item) => item.latestScore?.risk_band === "high" || item.latestScore?.risk_band === "very_high").length,
    requiringReviewCount: items.filter((item) => item.latestScore?.risk_band === "moderate" || item.latestScore?.risk_band === "high" || item.latestScore?.risk_band === "very_high").length,
    recentlyCheckedCount: items.filter((item) => {
      const value = item.latestScore?.run_at ?? item.watchlist.last_checked_at;
      return value ? Date.now() - new Date(value).getTime() <= 7 * 24 * 60 * 60 * 1000 : false;
    }).length,
    activeManualAdverseEventCount: items.reduce((sum, item) => sum + item.activeManualAdverseEventCount, 0)
  };
}

export function formatWatchlistMoney(value: number | null | undefined, currency = "GBP"): string {
  if (value == null || !Number.isFinite(value)) return "Not available";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function formatWatchlistValue(value: string | null | undefined): string {
  return value ? value.replace(/_/g, " ") : "Not available";
}

async function buildContexts(rows: WatchlistContextRow[]): Promise<WatchlistCompanyContext[]> {
  return Promise.all(rows.map(async (row) => {
    const history = await getScoreHistorySummary(row.company_number);
    return mapContextRow(row, history.ok ? history.data.movement : emptyMovement());
  }));
}

function mapContextRow(row: WatchlistContextRow, movement: ScoreMovementSummary): WatchlistCompanyContext {
  return {
    watchlist: {
      id: row.watchlist_id,
      company_id: row.company_id,
      added_by: row.added_by,
      added_at: row.added_at,
      is_active: row.is_active,
      removed_by: row.removed_by,
      removed_at: row.removed_at,
      watch_reason: row.watch_reason,
      last_checked_at: row.last_checked_at
    },
    company: {
      id: row.company_id,
      company_number: row.company_number,
      company_name: row.company_name
    },
    latestScore: row.score_run_id && row.snapshot_id && row.risk_band && row.confidence_level && row.run_at && row.source_fetched_at
      ? {
        score_run_id: row.score_run_id,
        snapshot_id: row.snapshot_id,
        score: row.score,
        risk_band: row.risk_band,
        confidence_level: row.confidence_level,
        recommended_limit: Number(row.recommended_limit ?? 0),
        currency: row.currency ?? "GBP",
        run_at: row.run_at,
        source_fetched_at: row.source_fetched_at
      }
      : null,
    latestDecision: row.decision_id && row.decision && row.decided_at
      ? { id: row.decision_id, decision: row.decision, decided_at: row.decided_at }
      : null,
    latestReport: row.report_id && row.exported_at ? { id: row.report_id, exported_at: row.exported_at } : null,
    scoreMovement: movement,
    activeManualAdverseEventCount: Number(row.active_manual_adverse_count ?? 0)
  };
}

function watchlistContextSql(): string {
  return `select
      watchlists.id as watchlist_id,
      watchlists.company_id,
      watchlists.added_by,
      watchlists.added_at::text,
      watchlists.is_active,
      watchlists.removed_by,
      watchlists.removed_at::text,
      watchlists.watch_reason,
      watchlists.last_checked_at::text,
      companies.company_number,
      companies.company_name,
      latest_score.score_run_id,
      latest_score.snapshot_id,
      latest_score.score,
      latest_score.risk_band,
      latest_score.confidence_level,
      latest_score.recommended_limit,
      latest_score.currency,
      latest_score.run_at,
      latest_score.source_fetched_at,
      latest_decision.id as decision_id,
      latest_decision.decision,
      latest_decision.decided_at,
      latest_report.id as report_id,
      latest_report.exported_at,
      coalesce(manual_counts.active_manual_adverse_count, 0) as active_manual_adverse_count
    from watchlists
    join companies on companies.id = watchlists.company_id
    left join lateral (
      select score_runs.id as score_run_id, score_runs.snapshot_id, score_runs.score,
        score_runs.risk_band, score_runs.confidence_level, score_runs.recommended_limit,
        score_runs.currency, score_runs.run_at::text, company_snapshots.source_fetched_at::text
      from score_runs
      join company_snapshots on company_snapshots.id = score_runs.snapshot_id
      where score_runs.company_id = companies.id
      order by score_runs.run_at desc
      limit 1
    ) latest_score on true
    left join lateral (
      select id, decision, decided_at::text
      from decision_records
      where company_id = companies.id
      order by decided_at desc
      limit 1
    ) latest_decision on true
    left join lateral (
      select id, exported_at::text
      from report_exports
      where company_id = companies.id
      order by exported_at desc
      limit 1
    ) latest_report on true
    left join lateral (
      select count(*) as active_manual_adverse_count
      from manual_adverse_events
      where company_id = companies.id and is_active = true and superseded_by_id is null
    ) manual_counts on true
    where watchlists.is_active = true`;
}

async function loadCompany(client: pg.PoolClient, companyNumber: string): Promise<WatchlistCompany | null> {
  const result = await client.query<WatchlistCompany>(
    `select id, company_number, company_name from companies where company_number = $1`,
    [companyNumber]
  );
  return result.rows[0] ?? null;
}

async function loadActiveWatchlistItem(client: pg.PoolClient, companyId: string): Promise<WatchlistItem | null> {
  const result = await client.query<WatchlistItem>(
    `select id, company_id, added_by, added_at::text, is_active, removed_by,
      removed_at::text, watch_reason, last_checked_at::text
     from watchlists
     where company_id = $1 and is_active = true
     limit 1`,
    [companyId]
  );
  return result.rows[0] ?? null;
}

async function loadLatestRemovedWatchlistItem(client: pg.PoolClient, companyId: string): Promise<WatchlistItem | null> {
  const result = await client.query<WatchlistItem>(
    `select id, company_id, added_by, added_at::text, is_active, removed_by,
      removed_at::text, watch_reason, last_checked_at::text
     from watchlists
     where company_id = $1 and is_active = false
     order by removed_at desc nulls last, added_at desc
     limit 1`,
    [companyId]
  );
  return result.rows[0] ?? null;
}

async function insertWatchlistItem(client: pg.PoolClient, companyId: string, watchReason: string | null, actorId: string | null): Promise<WatchlistItem> {
  const result = await client.query<WatchlistItem>(
    `insert into watchlists (company_id, added_by, watch_reason, last_checked_at)
     values ($1, $2, $3, now())
     returning id, company_id, added_by, added_at::text, is_active, removed_by,
       removed_at::text, watch_reason, last_checked_at::text`,
    [companyId, actorId ?? "anonymous_user", watchReason]
  );
  return result.rows[0]!;
}

async function reactivateWatchlistItem(client: pg.PoolClient, watchlistId: string, watchReason: string | null, actorId: string | null): Promise<WatchlistItem> {
  const result = await client.query<WatchlistItem>(
    `update watchlists
     set is_active = true, added_by = $1, added_at = now(), removed_by = null,
       removed_at = null, watch_reason = $2, last_checked_at = now()
     where id = $3
     returning id, company_id, added_by, added_at::text, is_active, removed_by,
       removed_at::text, watch_reason, last_checked_at::text`,
    [actorId ?? "anonymous_user", watchReason, watchlistId]
  );
  return result.rows[0]!;
}

async function deactivateWatchlistItem(client: pg.PoolClient, watchlistId: string, actorId: string | null): Promise<WatchlistItem> {
  const result = await client.query<WatchlistItem>(
    `update watchlists
     set is_active = false, removed_by = $1, removed_at = now()
     where id = $2 and is_active = true
     returning id, company_id, added_by, added_at::text, is_active, removed_by,
       removed_at::text, watch_reason, last_checked_at::text`,
    [actorId ?? "anonymous_user", watchlistId]
  );
  return result.rows[0]!;
}

async function insertWatchlistAuditEvent(
  client: pg.PoolClient,
  eventType: "watchlist.added" | "watchlist.removed",
  company: WatchlistCompany,
  item: WatchlistItem,
  options: WatchlistServiceOptions
): Promise<void> {
  await client.query(
    `insert into audit_events (
      actor_id, actor_type, event_type, entity_type, entity_id, company_id, metadata_json
    ) values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      options.actorId ?? null,
      options.actorId ? "user" : "anonymous_user",
      eventType,
      "watchlist",
      item.id,
      company.id,
      JSON.stringify(createWatchlistAuditMetadata({
        companyNumber: company.company_number,
        watchlistId: item.id,
        watchReasonPresent: Boolean(item.watch_reason),
        createdVia: options.createdVia ?? "watchlist_service"
      }))
    ]
  );
}

function normaliseWatchReason(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  return trimmed.slice(0, 500);
}

function emptyMovement(): ScoreMovementSummary {
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

function mapWatchlistError<T>(error: unknown, message: string): WatchlistServiceResult<T> {
  if (error instanceof DatabaseConfigurationError) {
    return { ok: false, error: { code: "missing_database_url", message: "Database connection is not configured on the server." } };
  }

  return { ok: false, error: { code: "database_error", message } };
}
