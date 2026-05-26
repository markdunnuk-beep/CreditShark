import type pg from "pg";
import { DatabaseConfigurationError, getDatabasePool } from "../db/client";
import { runCreditSharkScore } from "./engine";
import {
  mapManualAdverseEventRow,
  mapSnapshotEvidenceToScoreInput,
  validateScoreCompanyNumber,
  type PersistedAccountForScore,
  type PersistedChargeForScore,
  type PersistedCompanyForScore,
  type PersistedOfficerForScore,
  type PersistedPscForScore,
  type PersistedSnapshotForScore
} from "./snapshot-score-mapper";
import type {
  CreditRecommendation,
  ScoreReasonCode,
  ScoreRun,
  ScoringModelVersion
} from "../../types/creditshark";

export interface ScoringServiceOptions {
  actorId?: string | null;
  createdVia?: string;
}

export type ScoringServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ScoringServiceError };

export interface ScoringServiceError {
  code:
    | "invalid_company_number"
    | "missing_database_url"
    | "company_not_found"
    | "snapshot_not_found"
    | "model_not_configured"
    | "database_error";
  message: string;
}

export interface PersistedScoreRun extends Omit<ScoreRun, "reasonCodes"> {
  id: string;
  runAt: string;
}

export interface PersistedCreditRecommendation extends CreditRecommendation {
  id: string;
  createdAt: string;
}

export interface ScoreRunResult {
  company: PersistedCompanyForScore;
  snapshot: PersistedSnapshotForScore;
  scoreRun: PersistedScoreRun;
  reasonCodes: ScoreReasonCode[];
  recommendation: PersistedCreditRecommendation | null;
  missingDataFlags: string[];
  modelVersion: ScoringModelVersion;
}

interface ScoreRunRow {
  id: string;
  company_id: string;
  snapshot_id: string;
  model_version_id: string;
  score: number | null;
  risk_band: ScoreRun["riskBand"];
  confidence_level: ScoreRun["confidenceLevel"];
  recommended_limit: string | number;
  currency: string;
  manual_override_state: ScoreRun["manualOverrideState"];
  missing_data_flags_json: string[] | null;
  run_at: string;
}

interface ModelVersionRow {
  id: string;
  version: string;
  status: ScoringModelVersion["status"];
  band_thresholds_json: ScoringModelVersion["bandThresholds"];
  factor_weights_json: ScoringModelVersion["factorWeights"];
  limit_rules_json: ScoringModelVersion["limitRules"];
  change_note: string;
}

interface ManualAdverseEventRow {
  id: string;
  company_id: string;
  event_type: string;
  event_date: string;
  amount: string | number | null;
  currency: string;
  status: string;
  source_note: string;
  evidence_reference: string | null;
  entered_by: string;
  entered_at: string;
  superseded_by_id: string | null;
  is_active: boolean;
}

export async function getPublishedScoringModel(): Promise<ScoringServiceResult<ScoringModelVersion>> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<ModelVersionRow>(
      `select id, version, status, band_thresholds_json, factor_weights_json, limit_rules_json, change_note
       from scoring_model_versions
       where status = 'published'
       order by published_at desc nulls last, created_at desc
       limit 1`
    );

    const row = result.rows[0];
    if (!row) {
      return { ok: false, error: { code: "model_not_configured", message: "No published scoring model is configured." } };
    }

    return { ok: true, data: mapModelVersion(row) };
  } catch (error) {
    return mapScoringError(error, "Published scoring model could not be loaded.");
  }
}

export async function getLatestSnapshotForCompany(companyNumberInput: string): Promise<ScoringServiceResult<{
  company: PersistedCompanyForScore;
  snapshot: PersistedSnapshotForScore;
}>> {
  const companyNumber = validateScoreCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  try {
    const pool = getDatabasePool();
    const companyResult = await pool.query<PersistedCompanyForScore>(
      `select id, company_number, company_name, company_status, company_type,
        incorporated_on::text, dissolved_on::text
       from companies
       where company_number = $1`,
      [companyNumber]
    );
    const company = companyResult.rows[0];
    if (!company) {
      return { ok: false, error: { code: "company_not_found", message: "No company record exists yet. Open the company profile to create a snapshot first." } };
    }

    const snapshotResult = await pool.query<PersistedSnapshotForScore>(
      `select id, company_id, company_number, source_fetched_at::text, derived_status,
        derived_company_age_months, latest_accounts_date::text, latest_confirmation_statement_date::text,
        missing_sections_json, raw_profile_json
       from company_snapshots
       where company_id = $1
       order by source_fetched_at desc, created_at desc
       limit 1`,
      [company.id]
    );
    const snapshot = snapshotResult.rows[0];
    if (!snapshot) {
      return { ok: false, error: { code: "snapshot_not_found", message: "No snapshot exists yet. Open the company profile to create one first." } };
    }

    return { ok: true, data: { company, snapshot } };
  } catch (error) {
    return mapScoringError(error, "Latest snapshot could not be loaded.");
  }
}

export async function runAndPersistScoreForLatestSnapshot(
  companyNumberInput: string,
  options: ScoringServiceOptions = {}
): Promise<ScoringServiceResult<ScoreRunResult>> {
  const companyNumber = validateScoreCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      await client.query("begin");

      const loaded = await loadLatestSnapshotEvidence(client, companyNumber);
      if (!loaded.ok) {
        await client.query("rollback");
        return loaded;
      }

      const modelResult = await loadPublishedModel(client);
      if (!modelResult.ok) {
        await client.query("rollback");
        return modelResult;
      }

      const manualEvents = await loadActiveManualAdverseEvents(client, loaded.data.company.id);
      const scoreInput = mapSnapshotEvidenceToScoreInput(loaded.data);
      const score = runCreditSharkScore({
        snapshot: scoreInput,
        manualAdverseEvents: manualEvents.map(mapManualAdverseEventRow),
        modelVersion: modelResult.data
      });

      const scoreRun = await insertScoreRun(client, score, options.actorId ?? null, {
        source_fetched_at: loaded.data.snapshot.source_fetched_at,
        manual_adverse_event_count: manualEvents.length,
        evidence_counts: {
          accounts: loaded.data.accounts.length,
          charges: loaded.data.charges.length,
          officers: loaded.data.officers.length,
          pscs: loaded.data.pscs.length
        }
      });
      await insertReasonCodes(client, scoreRun.id, score.reasonCodes);
      const recommendation = await insertCreditRecommendation(client, loaded.data.company.id, scoreRun);
      await insertAuditEvent(client, loaded.data.company.id, scoreRun.id, loaded.data.snapshot.id, loaded.data.company.company_number, score.reasonCodes.length, options);
      await client.query("commit");

      return {
        ok: true,
        data: {
          company: loaded.data.company,
          snapshot: loaded.data.snapshot,
          scoreRun,
          reasonCodes: score.reasonCodes,
          recommendation,
          missingDataFlags: scoreRun.missingDataFlags,
          modelVersion: modelResult.data
        }
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return mapScoringError(error, "Score run could not be created.");
  }
}

export async function getLatestScoreRunForCompany(companyNumberInput: string): Promise<ScoringServiceResult<ScoreRunResult>> {
  const companyNumber = validateScoreCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      const companyResult = await client.query<PersistedCompanyForScore>(
        `select id, company_number, company_name, company_status, company_type,
          incorporated_on::text, dissolved_on::text
         from companies
         where company_number = $1`,
        [companyNumber]
      );
      const company = companyResult.rows[0];
      if (!company) {
        return { ok: false, error: { code: "company_not_found", message: "No company record exists yet. Open the company profile to create a score first." } };
      }

      const scoreRunResult = await client.query<ScoreRunRow>(
        `select id, company_id, snapshot_id, model_version_id, score, risk_band, confidence_level,
          recommended_limit, currency, manual_override_state, missing_data_flags_json, run_at::text
         from score_runs
         where company_id = $1
         order by run_at desc
         limit 1`,
        [company.id]
      );
      const row = scoreRunResult.rows[0];
      if (!row) {
        return { ok: false, error: { code: "snapshot_not_found", message: "No score run exists yet. Open the company profile to create and score the latest snapshot." } };
      }

      return await loadScoreRunDetail(client, row.id, company);
    } finally {
      client.release();
    }
  } catch (error) {
    return mapScoringError(error, "Latest score run could not be loaded.");
  }
}

export async function getScoreRunDetail(scoreRunId: string): Promise<ScoringServiceResult<ScoreRunResult>> {
  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      return await loadScoreRunDetail(client, scoreRunId);
    } finally {
      client.release();
    }
  } catch (error) {
    return mapScoringError(error, "Score run detail could not be loaded.");
  }
}

async function loadLatestSnapshotEvidence(client: pg.PoolClient, companyNumber: string): Promise<ScoringServiceResult<{
  company: PersistedCompanyForScore;
  snapshot: PersistedSnapshotForScore;
  accounts: PersistedAccountForScore[];
  charges: PersistedChargeForScore[];
  officers: PersistedOfficerForScore[];
  pscs: PersistedPscForScore[];
}>> {
  const companyResult = await client.query<PersistedCompanyForScore>(
    `select id, company_number, company_name, company_status, company_type,
      incorporated_on::text, dissolved_on::text
     from companies
     where company_number = $1`,
    [companyNumber]
  );
  const company = companyResult.rows[0];
  if (!company) {
    return { ok: false, error: { code: "company_not_found", message: "No company record exists yet. Open the company profile to create a snapshot first." } };
  }

  const snapshotResult = await client.query<PersistedSnapshotForScore>(
    `select id, company_id, company_number, source_fetched_at::text, derived_status,
      derived_company_age_months, latest_accounts_date::text, latest_confirmation_statement_date::text,
      missing_sections_json, raw_profile_json
     from company_snapshots
     where company_id = $1
     order by source_fetched_at desc, created_at desc
     limit 1`,
    [company.id]
  );
  const snapshot = snapshotResult.rows[0];
  if (!snapshot) {
    return { ok: false, error: { code: "snapshot_not_found", message: "No snapshot exists yet. Open the company profile to create one first." } };
  }

  const accounts = await client.query<PersistedAccountForScore>(
    `select id, period_end::text, accounts_type, currency, turnover, profit_before_tax,
      profit_after_tax, net_assets, cash, total_liabilities, employees, extraction_method
     from company_accounts
     where snapshot_id = $1
     order by period_end desc nulls last`,
    [snapshot.id]
  );
  const charges = await client.query<PersistedChargeForScore>(
    `select id, status, created_on::text, satisfied_on::text
     from company_charges
     where snapshot_id = $1`,
    [snapshot.id]
  );
  const officers = await client.query<PersistedOfficerForScore>(
    `select id, officer_name, officer_role, appointed_on::text, resigned_on::text
     from company_officers
     where snapshot_id = $1`,
    [snapshot.id]
  );
  const pscs = await client.query<PersistedPscForScore>(
    `select id, psc_name, psc_kind, ceased_on::text
     from company_pscs
     where snapshot_id = $1`,
    [snapshot.id]
  );

  return {
    ok: true,
    data: {
      company,
      snapshot,
      accounts: accounts.rows,
      charges: charges.rows,
      officers: officers.rows,
      pscs: pscs.rows
    }
  };
}

async function loadPublishedModel(client: pg.PoolClient): Promise<ScoringServiceResult<ScoringModelVersion>> {
  const result = await client.query<ModelVersionRow>(
    `select id, version, status, band_thresholds_json, factor_weights_json, limit_rules_json, change_note
     from scoring_model_versions
     where status = 'published'
     order by published_at desc nulls last, created_at desc
     limit 1`
  );
  const row = result.rows[0];
  if (!row) {
    return { ok: false, error: { code: "model_not_configured", message: "No published scoring model is configured." } };
  }
  return { ok: true, data: mapModelVersion(row) };
}

async function loadActiveManualAdverseEvents(client: pg.PoolClient, companyId: string): Promise<ManualAdverseEventRow[]> {
  const result = await client.query<ManualAdverseEventRow>(
    `select id, company_id, event_type, event_date::text, amount, currency, status,
      source_note, evidence_reference, entered_by, entered_at::text, superseded_by_id, is_active
     from manual_adverse_events
     where company_id = $1 and is_active = true and superseded_by_id is null
     order by event_date desc`,
    [companyId]
  );
  return result.rows;
}

async function insertScoreRun(
  client: pg.PoolClient,
  score: ScoreRun,
  actorId: string | null,
  inputSummary: Record<string, unknown>
): Promise<PersistedScoreRun> {
  const result = await client.query<ScoreRunRow>(
    `insert into score_runs (
      company_id, snapshot_id, model_version_id, score, risk_band, confidence_level,
      recommended_limit, currency, manual_override_state, missing_data_flags_json,
      input_summary_json, run_by
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    returning id, company_id, snapshot_id, model_version_id, score, risk_band,
      confidence_level, recommended_limit, currency, manual_override_state,
      missing_data_flags_json, run_at::text`,
    [
      score.companyId,
      score.snapshotId,
      score.modelVersionId,
      score.score,
      score.riskBand,
      score.confidenceLevel,
      score.recommendedLimit,
      score.currency,
      score.manualOverrideState,
      JSON.stringify(score.missingDataFlags),
      JSON.stringify(inputSummary),
      actorId
    ]
  );
  return mapScoreRunRow(result.rows[0]!);
}

async function insertReasonCodes(client: pg.PoolClient, scoreRunId: string, reasons: ScoreReasonCode[]): Promise<void> {
  for (const [index, reason] of reasons.entries()) {
    await client.query(
      `insert into score_reason_codes (
        score_run_id, code, label, "group", direction, weight, impact,
        source_type, source_id, source_date, explanation, sort_order
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        scoreRunId,
        reason.code,
        reason.label,
        reason.group,
        reason.direction,
        reason.weight,
        reason.impact,
        reason.sourceType,
        reason.sourceId ?? null,
        dateOnly(reason.sourceDate),
        reason.explanation,
        index
      ]
    );
  }
}

async function insertCreditRecommendation(
  client: pg.PoolClient,
  companyId: string,
  scoreRun: PersistedScoreRun
): Promise<PersistedCreditRecommendation> {
  const basis = `Rule-based advisory recommendation from CreditShark scoring model ${scoreRun.modelVersionId}.`;
  const result = await client.query<{
    id: string;
    company_id: string;
    score_run_id: string;
    recommended_limit: string | number;
    currency: string;
    basis: string;
    limit_cap_reason: string | null;
    created_at: string;
  }>(
    `insert into credit_recommendations (
      company_id, score_run_id, recommended_limit, currency, basis, limit_cap_reason
    ) values ($1, $2, $3, $4, $5, $6)
    returning id, company_id, score_run_id, recommended_limit, currency, basis, limit_cap_reason, created_at::text`,
    [companyId, scoreRun.id, scoreRun.recommendedLimit, scoreRun.currency, basis, scoreRun.confidenceLevel === "low" || scoreRun.confidenceLevel === "insufficient" ? "confidence_cap" : null]
  );
  const row = result.rows[0]!;
  return {
    id: row.id,
    companyId: row.company_id,
    scoreRunId: row.score_run_id,
    recommendedLimit: Number(row.recommended_limit),
    currency: row.currency,
    basis: row.basis,
    limitCapReason: row.limit_cap_reason ?? undefined,
    createdAt: row.created_at
  };
}

async function insertAuditEvent(
  client: pg.PoolClient,
  companyId: string,
  scoreRunId: string,
  snapshotId: string,
  companyNumber: string,
  reasonCodeCount: number,
  options: ScoringServiceOptions
): Promise<void> {
  await client.query(
    `insert into audit_events (
      actor_id, actor_type, event_type, entity_type, entity_id, company_id, metadata_json
    ) values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      options.actorId ?? null,
      options.actorId ? "user" : "anonymous_user",
      "score.run.created",
      "score_run",
      scoreRunId,
      companyId,
      JSON.stringify({
        company_number: companyNumber,
        snapshot_id: snapshotId,
        score_run_id: scoreRunId,
        reason_code_count: reasonCodeCount,
        created_via: options.createdVia ?? "score_service"
      })
    ]
  );
}

async function loadScoreRunDetail(
  client: pg.PoolClient,
  scoreRunId: string,
  knownCompany?: PersistedCompanyForScore
): Promise<ScoringServiceResult<ScoreRunResult>> {
  const scoreRunResult = await client.query<ScoreRunRow>(
    `select id, company_id, snapshot_id, model_version_id, score, risk_band, confidence_level,
      recommended_limit, currency, manual_override_state, missing_data_flags_json, run_at::text
     from score_runs
     where id = $1`,
    [scoreRunId]
  );
  const scoreRunRow = scoreRunResult.rows[0];
  if (!scoreRunRow) {
    return { ok: false, error: { code: "snapshot_not_found", message: "Score run was not found." } };
  }
  const scoreRun = mapScoreRunRow(scoreRunRow);

  const companyResult = knownCompany
    ? { rows: [knownCompany] }
    : await client.query<PersistedCompanyForScore>(
      `select id, company_number, company_name, company_status, company_type,
        incorporated_on::text, dissolved_on::text
       from companies where id = $1`,
      [scoreRun.companyId]
    );
  const snapshotResult = await client.query<PersistedSnapshotForScore>(
    `select id, company_id, company_number, source_fetched_at::text, derived_status,
      derived_company_age_months, latest_accounts_date::text, latest_confirmation_statement_date::text,
      missing_sections_json, raw_profile_json
     from company_snapshots
     where id = $1`,
    [scoreRun.snapshotId]
  );
  const modelResult = await client.query<ModelVersionRow>(
    `select id, version, status, band_thresholds_json, factor_weights_json, limit_rules_json, change_note
     from scoring_model_versions
     where id = $1`,
    [scoreRun.modelVersionId]
  );
  const reasonResult = await client.query<{
    code: string;
    label: string;
    group: string;
    direction: ScoreReasonCode["direction"];
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
  );
  const recommendationResult = await client.query<{
    id: string;
    company_id: string;
    score_run_id: string;
    recommended_limit: string | number;
    currency: string;
    basis: string;
    limit_cap_reason: string | null;
    created_at: string;
  }>(
    `select id, company_id, score_run_id, recommended_limit, currency, basis, limit_cap_reason, created_at::text
     from credit_recommendations
     where score_run_id = $1
     order by created_at desc
     limit 1`,
    [scoreRun.id]
  );

  const company = companyResult.rows[0];
  const snapshot = snapshotResult.rows[0];
  const model = modelResult.rows[0];
  if (!company || !snapshot || !model) {
    return { ok: false, error: { code: "database_error", message: "Score run detail is incomplete." } };
  }

  return {
    ok: true,
    data: {
      company,
      snapshot,
      scoreRun,
      reasonCodes: reasonResult.rows.map((reason) => ({
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
      })),
      recommendation: recommendationResult.rows[0]
        ? {
          id: recommendationResult.rows[0].id,
          companyId: recommendationResult.rows[0].company_id,
          scoreRunId: recommendationResult.rows[0].score_run_id,
          recommendedLimit: Number(recommendationResult.rows[0].recommended_limit),
          currency: recommendationResult.rows[0].currency,
          basis: recommendationResult.rows[0].basis,
          limitCapReason: recommendationResult.rows[0].limit_cap_reason ?? undefined,
          createdAt: recommendationResult.rows[0].created_at
        }
        : null,
      missingDataFlags: scoreRun.missingDataFlags,
      modelVersion: mapModelVersion(model)
    }
  };
}

function mapModelVersion(row: ModelVersionRow): ScoringModelVersion {
  return {
    id: row.id,
    version: row.version,
    status: row.status,
    bandThresholds: row.band_thresholds_json,
    factorWeights: row.factor_weights_json,
    limitRules: row.limit_rules_json,
    changeNote: row.change_note
  };
}

function mapScoreRunRow(row: ScoreRunRow): PersistedScoreRun {
  return {
    id: row.id,
    companyId: row.company_id,
    snapshotId: row.snapshot_id,
    modelVersionId: row.model_version_id,
    score: row.score,
    riskBand: row.risk_band,
    confidenceLevel: row.confidence_level,
    recommendedLimit: Number(row.recommended_limit),
    currency: row.currency,
    manualOverrideState: row.manual_override_state,
    missingDataFlags: row.missing_data_flags_json ?? [],
    runAt: row.run_at
  };
}

function mapScoringError<T>(error: unknown, message: string): ScoringServiceResult<T> {
  if (error instanceof DatabaseConfigurationError) {
    return { ok: false, error: { code: "missing_database_url", message: "Database connection is not configured on the server." } };
  }

  return { ok: false, error: { code: "database_error", message } };
}

function dateOnly(value: string | undefined): string | null {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
}
