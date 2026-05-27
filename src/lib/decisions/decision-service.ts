import type pg from "pg";
import { sanitiseCompanyNumber } from "../companies/companies-house-normalisers";
import { DatabaseConfigurationError, getDatabasePool } from "../db/client";
import type { ConfidenceLevel, RiskBand } from "../../types/creditshark";

export const DECISION_RECORD_VALUES = [
  "approve_within_recommended_limit",
  "refer_for_review",
  "decline_or_prepayment_only"
] as const;

export type DecisionRecordValue = typeof DECISION_RECORD_VALUES[number];
export type PersistedDecisionValue = "approve" | "refer" | "reject";

export interface DecisionRecordInput {
  decision: string;
  requested_limit?: string | number | null;
  approved_limit?: string | number | null;
  currency?: string | null;
  reviewer_notes?: string | null;
  override_reason?: string | null;
}

export interface ValidatedDecisionRecordInput {
  decision: DecisionRecordValue;
  persistedDecision: PersistedDecisionValue;
  requestedLimit: number | null;
  approvedLimit: number | null;
  currency: string;
  reviewerNotes: string;
  overrideReason: string | null;
  overrideRequired: boolean;
}

export interface DecisionCompany {
  id: string;
  company_number: string;
  company_name: string;
}

export interface DecisionScoreRun {
  id: string;
  company_id: string;
  snapshot_id: string;
  model_version_id: string;
  score: number | null;
  risk_band: RiskBand;
  confidence_level: ConfidenceLevel;
  recommended_limit: string | number | null;
  currency: string;
  run_at: string;
}

export interface DecisionRecommendation {
  id: string;
  company_id: string;
  score_run_id: string;
  recommended_limit: string | number | null;
  currency: string;
  basis: string;
  limit_cap_reason: string | null;
  created_at: string;
}

export interface DecisionSnapshot {
  id: string;
  source_fetched_at: string;
}

export interface DecisionModelVersion {
  id: string;
  version: string;
}

export interface DecisionRecord {
  id: string;
  company_id: string;
  score_run_id: string;
  credit_recommendation_id: string | null;
  decision: PersistedDecisionValue;
  decision_value: DecisionRecordValue;
  requested_limit: string | number | null;
  approved_limit: string | number | null;
  currency: string;
  reviewer_notes: string;
  override_reason: string | null;
  decided_by: string;
  decided_at: string;
  recommended_limit: string | number | null;
  risk_band: RiskBand | null;
}

export interface DecisionWorkflowData {
  company: DecisionCompany;
  scoreRun: DecisionScoreRun;
  recommendation: DecisionRecommendation | null;
  snapshot: DecisionSnapshot;
  modelVersion: DecisionModelVersion;
  latestDecision: DecisionRecord | null;
  decisionHistory: DecisionRecord[];
}

export type DecisionServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: DecisionServiceError };

export interface DecisionServiceError {
  code: "invalid_company_number" | "invalid_input" | "missing_database_url" | "company_not_found" | "score_run_not_found" | "database_error";
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface DecisionServiceOptions {
  actorId?: string | null;
  createdVia?: string;
}

export async function getDecisionWorkflowForCompany(companyNumberInput: string): Promise<DecisionServiceResult<DecisionWorkflowData>> {
  const loaded = await loadDecisionContext(companyNumberInput);
  if (!loaded.ok) return loaded;

  return {
    ok: true,
    data: {
      ...loaded.data,
      latestDecision: loaded.data.decisionHistory[0] ?? null
    }
  };
}

export async function getDecisionHistoryForCompany(companyNumberInput: string): Promise<DecisionServiceResult<{
  company: DecisionCompany;
  decisions: DecisionRecord[];
}>> {
  const loaded = await loadCompanyAndDecisions(companyNumberInput);
  if (!loaded.ok) return loaded;
  return { ok: true, data: { company: loaded.data.company, decisions: loaded.data.decisions } };
}

export async function getLatestDecisionForCompany(companyNumberInput: string): Promise<DecisionServiceResult<{
  company: DecisionCompany;
  decision: DecisionRecord | null;
}>> {
  const loaded = await loadCompanyAndDecisions(companyNumberInput);
  if (!loaded.ok) return loaded;
  return { ok: true, data: { company: loaded.data.company, decision: loaded.data.decisions[0] ?? null } };
}

export async function createDecisionRecord(
  companyNumberInput: string,
  input: DecisionRecordInput,
  options: DecisionServiceOptions = {}
): Promise<DecisionServiceResult<DecisionRecord>> {
  const loaded = await loadDecisionContext(companyNumberInput);
  if (!loaded.ok) return loaded;

  const validated = validateDecisionInput(input, loaded.data.recommendation, loaded.data.scoreRun);
  if (!validated.ok) return validated;

  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      await client.query("begin");
      const inserted = await insertDecisionRecord(client, loaded.data.company.id, loaded.data.scoreRun.id, loaded.data.recommendation?.id ?? null, validated.data, options.actorId ?? null);
      await insertDecisionAuditEvent(client, loaded.data.company, inserted, options, loaded.data.recommendation);
      await client.query("commit");
      return { ok: true, data: { ...inserted, recommended_limit: loaded.data.recommendation?.recommended_limit ?? null, risk_band: loaded.data.scoreRun.risk_band } };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return mapDecisionError(error, "Decision record could not be created.");
  }
}

export function validateDecisionInput(
  input: DecisionRecordInput,
  recommendation: Pick<DecisionRecommendation, "recommended_limit"> | null,
  scoreRun?: Pick<DecisionScoreRun, "risk_band" | "recommended_limit"> | null
): DecisionServiceResult<ValidatedDecisionRecordInput> {
  const fieldErrors: Record<string, string> = {};
  const decision = input.decision.trim() as DecisionRecordValue;
  const requestedLimit = parseLimit(input.requested_limit);
  const approvedLimit = parseLimit(input.approved_limit);
  const currency = (input.currency?.trim() || "GBP").toUpperCase();
  const reviewerNotes = input.reviewer_notes?.trim() ?? "";
  const overrideReason = input.override_reason?.trim() || null;
  const recommendedLimit = parseRecommendedLimit(recommendation, scoreRun);

  if (!DECISION_RECORD_VALUES.includes(decision)) {
    fieldErrors.decision = "Choose a supported user-recorded decision.";
  }

  if (requestedLimit === "invalid") {
    fieldErrors.requested_limit = "Requested limit must be numeric and non-negative.";
  }

  if (approvedLimit === "invalid") {
    fieldErrors.approved_limit = "Final approved limit must be numeric and non-negative.";
  }

  if (decision === "approve_within_recommended_limit" && approvedLimit == null) {
    fieldErrors.approved_limit = "Final approved limit is required when recording an approval.";
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    fieldErrors.currency = "Use a three-letter currency code.";
  }

  if (reviewerNotes.length < 8) {
    fieldErrors.reviewer_notes = "Reviewer notes are required.";
  }

  const cleanApprovedLimit = approvedLimit === "invalid" ? null : approvedLimit;
  const overrideRequired = overrideIsRequired({
    decision,
    approvedLimit: cleanApprovedLimit,
    recommendedLimit,
    riskBand: scoreRun?.risk_band ?? null
  });

  if (overrideRequired && (!overrideReason || overrideReason.length < 8)) {
    fieldErrors.override_reason = "Override reason is required when the recorded decision goes outside the recommendation.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: { code: "invalid_input", message: "Decision record input is incomplete or invalid.", fieldErrors } };
  }

  return {
    ok: true,
    data: {
      decision,
      persistedDecision: toPersistedDecision(decision),
      requestedLimit: requestedLimit === "invalid" ? null : requestedLimit,
      approvedLimit: cleanApprovedLimit,
      currency,
      reviewerNotes,
      overrideReason,
      overrideRequired
    }
  };
}

export function createDecisionAuditMetadata(input: {
  companyNumber: string;
  decisionRecordId: string;
  scoreRunId: string;
  creditRecommendationId: string | null;
  decision: DecisionRecordValue;
  requestedLimit: number | null;
  approvedLimit: number | null;
  currency: string;
  overridePresent: boolean;
  createdVia: string;
}): Record<string, unknown> {
  return {
    company_number: input.companyNumber,
    decision_record_id: input.decisionRecordId,
    score_run_id: input.scoreRunId,
    credit_recommendation_id: input.creditRecommendationId,
    decision: input.decision,
    requested_limit: input.requestedLimit,
    approved_limit: input.approvedLimit,
    currency: input.currency,
    override_present: input.overridePresent,
    created_via: input.createdVia
  };
}

export function formatDecisionLabel(value: DecisionRecordValue | PersistedDecisionValue): string {
  const decisionValue = value === "approve" || value === "refer" || value === "reject" ? fromPersistedDecision(value) : value;
  const labels: Record<DecisionRecordValue, string> = {
    approve_within_recommended_limit: "Approve within recommended limit",
    refer_for_review: "Refer for review",
    decline_or_prepayment_only: "Decline or prepayment only"
  };
  return labels[decisionValue];
}

export function formatDecisionMoney(value: string | number | null | undefined, currency = "GBP"): string {
  if (value == null) return "Not recorded";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value));
}

function overrideIsRequired(input: {
  decision: DecisionRecordValue;
  approvedLimit: number | null;
  recommendedLimit: number | null;
  riskBand: RiskBand | null;
}): boolean {
  if (input.decision !== "approve_within_recommended_limit") return false;
  if ((input.approvedLimit ?? 0) <= 0) return false;
  if (input.recommendedLimit == null) return true;
  if (input.approvedLimit != null && input.approvedLimit > input.recommendedLimit) return true;
  return input.riskBand === "high" || input.riskBand === "very_high" || input.riskBand === "not_scored";
}

function parseRecommendedLimit(
  recommendation: Pick<DecisionRecommendation, "recommended_limit"> | null,
  scoreRun?: Pick<DecisionScoreRun, "recommended_limit"> | null
): number | null {
  const source = recommendation?.recommended_limit ?? scoreRun?.recommended_limit ?? null;
  if (source == null) return null;
  const parsed = Number(source);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseLimit(value: string | number | null | undefined): number | null | "invalid" {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : "invalid";
}

function toPersistedDecision(decision: DecisionRecordValue): PersistedDecisionValue {
  if (decision === "approve_within_recommended_limit") return "approve";
  if (decision === "refer_for_review") return "refer";
  return "reject";
}

function fromPersistedDecision(decision: PersistedDecisionValue): DecisionRecordValue {
  if (decision === "approve") return "approve_within_recommended_limit";
  if (decision === "refer") return "refer_for_review";
  return "decline_or_prepayment_only";
}

async function loadDecisionContext(companyNumberInput: string): Promise<DecisionServiceResult<DecisionWorkflowData>> {
  const companyNumber = sanitiseCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      const company = await loadCompany(client, companyNumber);
      if (!company) return { ok: false, error: { code: "company_not_found", message: "Open the company profile before recording a decision." } };

      const scoreRun = await loadLatestScoreRun(client, company.id);
      if (!scoreRun) return { ok: false, error: { code: "score_run_not_found", message: "Run an advisory score before recording a decision." } };

      const recommendation = await loadRecommendation(client, scoreRun.id);
      const snapshot = await loadSnapshot(client, scoreRun.snapshot_id);
      const modelVersion = await loadModelVersion(client, scoreRun.model_version_id);
      const decisionHistory = await loadDecisionHistory(client, company.id);

      if (!snapshot) return { ok: false, error: { code: "database_error", message: "The latest score run is missing its linked snapshot." } };

      return {
        ok: true,
        data: {
          company,
          scoreRun,
          recommendation,
          snapshot,
          modelVersion: modelVersion ?? { id: scoreRun.model_version_id, version: "Unknown" },
          latestDecision: decisionHistory[0] ?? null,
          decisionHistory
        }
      };
    } finally {
      client.release();
    }
  } catch (error) {
    return mapDecisionError(error, "Decision workflow data could not be loaded.");
  }
}

async function loadCompanyAndDecisions(companyNumberInput: string): Promise<DecisionServiceResult<{
  company: DecisionCompany;
  decisions: DecisionRecord[];
}>> {
  const companyNumber = sanitiseCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      const company = await loadCompany(client, companyNumber);
      if (!company) return { ok: false, error: { code: "company_not_found", message: "Open the company profile before reviewing decisions." } };
      return { ok: true, data: { company, decisions: await loadDecisionHistory(client, company.id) } };
    } finally {
      client.release();
    }
  } catch (error) {
    return mapDecisionError(error, "Decision history could not be loaded.");
  }
}

async function loadCompany(client: pg.PoolClient, companyNumber: string): Promise<DecisionCompany | null> {
  const result = await client.query<DecisionCompany>(
    `select id, company_number, company_name from companies where company_number = $1`,
    [companyNumber]
  );
  return result.rows[0] ?? null;
}

async function loadLatestScoreRun(client: pg.PoolClient, companyId: string): Promise<DecisionScoreRun | null> {
  const result = await client.query<DecisionScoreRun>(
    `select id, company_id, snapshot_id, model_version_id, score, risk_band, confidence_level,
      recommended_limit, currency, run_at::text
     from score_runs
     where company_id = $1
     order by run_at desc
     limit 1`,
    [companyId]
  );
  return result.rows[0] ?? null;
}

async function loadRecommendation(client: pg.PoolClient, scoreRunId: string): Promise<DecisionRecommendation | null> {
  const result = await client.query<DecisionRecommendation>(
    `select id, company_id, score_run_id, recommended_limit, currency, basis,
      limit_cap_reason, created_at::text
     from credit_recommendations
     where score_run_id = $1
     order by created_at desc
     limit 1`,
    [scoreRunId]
  );
  return result.rows[0] ?? null;
}

async function loadSnapshot(client: pg.PoolClient, snapshotId: string): Promise<DecisionSnapshot | null> {
  const result = await client.query<DecisionSnapshot>(
    `select id, source_fetched_at::text from company_snapshots where id = $1`,
    [snapshotId]
  );
  return result.rows[0] ?? null;
}

async function loadModelVersion(client: pg.PoolClient, modelVersionId: string): Promise<DecisionModelVersion | null> {
  const result = await client.query<DecisionModelVersion>(
    `select id, version from scoring_model_versions where id = $1`,
    [modelVersionId]
  );
  return result.rows[0] ?? null;
}

async function loadDecisionHistory(client: pg.PoolClient, companyId: string): Promise<DecisionRecord[]> {
  const result = await client.query<DecisionRecord>(
    `select
      decision_records.id,
      decision_records.company_id,
      decision_records.score_run_id,
      decision_records.credit_recommendation_id,
      decision_records.decision,
      case decision_records.decision
        when 'approve' then 'approve_within_recommended_limit'
        when 'refer' then 'refer_for_review'
        else 'decline_or_prepayment_only'
      end as decision_value,
      decision_records.requested_limit,
      decision_records.approved_limit,
      decision_records.currency,
      decision_records.reviewer_notes,
      decision_records.override_reason,
      decision_records.decided_by,
      decision_records.decided_at::text,
      credit_recommendations.recommended_limit,
      score_runs.risk_band
     from decision_records
     left join credit_recommendations on credit_recommendations.id = decision_records.credit_recommendation_id
     left join score_runs on score_runs.id = decision_records.score_run_id
     where decision_records.company_id = $1
     order by decision_records.decided_at desc`,
    [companyId]
  );
  return result.rows;
}

async function insertDecisionRecord(
  client: pg.PoolClient,
  companyId: string,
  scoreRunId: string,
  recommendationId: string | null,
  input: ValidatedDecisionRecordInput,
  actorId: string | null
): Promise<DecisionRecord> {
  const result = await client.query<DecisionRecord>(
    `insert into decision_records (
      company_id, score_run_id, credit_recommendation_id, decision, approved_limit,
      requested_limit, currency, reviewer_notes, override_reason, decided_by
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    returning id, company_id, score_run_id, credit_recommendation_id, decision,
      case decision
        when 'approve' then 'approve_within_recommended_limit'
        when 'refer' then 'refer_for_review'
        else 'decline_or_prepayment_only'
      end as decision_value,
      requested_limit, approved_limit, currency, reviewer_notes, override_reason,
      decided_by, decided_at::text, null::numeric as recommended_limit, null::text as risk_band`,
    [
      companyId,
      scoreRunId,
      recommendationId,
      input.persistedDecision,
      input.approvedLimit,
      input.requestedLimit,
      input.currency,
      input.reviewerNotes,
      input.overrideReason,
      actorId ?? "anonymous_user"
    ]
  );
  return result.rows[0]!;
}

async function insertDecisionAuditEvent(
  client: pg.PoolClient,
  company: DecisionCompany,
  decision: DecisionRecord,
  options: DecisionServiceOptions,
  recommendation: DecisionRecommendation | null
): Promise<void> {
  const metadata = createDecisionAuditMetadata({
    companyNumber: company.company_number,
    decisionRecordId: decision.id,
    scoreRunId: decision.score_run_id,
    creditRecommendationId: decision.credit_recommendation_id,
    decision: decision.decision_value,
    requestedLimit: decision.requested_limit == null ? null : Number(decision.requested_limit),
    approvedLimit: decision.approved_limit == null ? null : Number(decision.approved_limit),
    currency: decision.currency,
    overridePresent: Boolean(decision.override_reason),
    createdVia: options.createdVia ?? "decision_service"
  });

  await client.query(
    `insert into audit_events (
      actor_id, actor_type, event_type, entity_type, entity_id, company_id, metadata_json
    ) values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      options.actorId ?? null,
      options.actorId ? "user" : "anonymous_user",
      "decision.created",
      "decision_record",
      decision.id,
      company.id,
      JSON.stringify({
        ...metadata,
        recommended_limit: recommendation?.recommended_limit == null ? null : Number(recommendation.recommended_limit)
      })
    ]
  );
}

function mapDecisionError<T>(error: unknown, message: string): DecisionServiceResult<T> {
  if (error instanceof DatabaseConfigurationError) {
    return { ok: false, error: { code: "missing_database_url", message: "Database connection is not configured on the server." } };
  }

  return { ok: false, error: { code: "database_error", message } };
}
