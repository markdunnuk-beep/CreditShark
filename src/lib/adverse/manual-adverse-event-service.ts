import type pg from "pg";
import { sanitiseCompanyNumber } from "../companies/companies-house-normalisers";
import { DatabaseConfigurationError, getDatabasePool } from "../db/client";

export const MANUAL_ADVERSE_EVENT_TYPES = ["ccj", "payment_default", "insolvency_note", "adverse_note", "other"] as const;
export const MANUAL_ADVERSE_EVENT_STATUSES = ["unsatisfied", "satisfied", "disputed", "paid", "unknown", "note_only"] as const;

export type ManualAdverseEventType = typeof MANUAL_ADVERSE_EVENT_TYPES[number];
export type ManualAdverseEventStatus = typeof MANUAL_ADVERSE_EVENT_STATUSES[number];

export interface ManualAdverseEventInput {
  eventType: string;
  eventDate?: string | null;
  amount?: string | number | null;
  currency?: string | null;
  status: string;
  sourceNote: string;
  evidenceReference?: string | null;
  isActive?: boolean;
}

export interface ValidatedManualAdverseEventInput {
  eventType: ManualAdverseEventType;
  eventDate: string | null;
  amount: number | null;
  currency: string;
  status: ManualAdverseEventStatus;
  sourceNote: string;
  evidenceReference: string | null;
  isActive: boolean;
}

export interface ManualAdverseEventRecord {
  id: string;
  company_id: string;
  event_type: ManualAdverseEventType;
  event_date: string;
  amount: string | number | null;
  currency: string;
  status: ManualAdverseEventStatus;
  source_note: string;
  evidence_reference: string | null;
  entered_by: string;
  entered_at: string;
  updated_by: string | null;
  updated_at: string | null;
  superseded_by_id: string | null;
  is_active: boolean;
}

export interface ManualAdverseCompany {
  id: string;
  company_number: string;
  company_name: string;
}

export interface ManualAdverseChargesSummary {
  active: number;
  satisfied: number;
  latestChargeDate: string | null;
  snapshotId: string | null;
  sourceFetchedAt: string | null;
}

export interface ManualAdverseEventsForCompany {
  company: ManualAdverseCompany;
  activeEvents: ManualAdverseEventRecord[];
  inactiveEvents: ManualAdverseEventRecord[];
  chargesSummary: ManualAdverseChargesSummary;
}

export type ManualAdverseServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ManualAdverseServiceError };

export interface ManualAdverseServiceError {
  code: "invalid_company_number" | "invalid_input" | "missing_database_url" | "company_not_found" | "event_not_found" | "database_error";
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface ManualAdverseServiceOptions {
  actorId?: string | null;
  createdVia?: string;
}

export function validateManualAdverseEventInput(input: ManualAdverseEventInput): ManualAdverseServiceResult<ValidatedManualAdverseEventInput> {
  const fieldErrors: Record<string, string> = {};
  const eventType = input.eventType.trim() as ManualAdverseEventType;
  const status = input.status.trim() as ManualAdverseEventStatus;
  const sourceNote = input.sourceNote.trim();
  const currency = (input.currency?.trim() || "GBP").toUpperCase();
  const evidenceReference = input.evidenceReference?.trim() || null;
  const amount = parseAmount(input.amount);
  const eventDate = input.eventDate?.trim() || null;

  if (!MANUAL_ADVERSE_EVENT_TYPES.includes(eventType)) {
    fieldErrors.eventType = "Choose a supported manual event type.";
  }

  if (!MANUAL_ADVERSE_EVENT_STATUSES.includes(status)) {
    fieldErrors.status = "Choose a supported status.";
  }

  if ((eventType === "ccj" || eventType === "payment_default") && !eventDate) {
    fieldErrors.eventDate = "Event date is required for CCJ and payment default records.";
  }

  if (eventDate && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    fieldErrors.eventDate = "Use a valid event date.";
  }

  if (amount === "invalid") {
    fieldErrors.amount = "Amount must be numeric and non-negative.";
  }

  if (!/^[A-Z]{3}$/.test(currency)) {
    fieldErrors.currency = "Use a three-letter currency code.";
  }

  if (sourceNote.length < 8) {
    fieldErrors.sourceNote = "Source note must briefly explain where the manual information came from.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: { code: "invalid_input", message: "Manual adverse event input is incomplete or invalid.", fieldErrors } };
  }

  return {
    ok: true,
    data: {
      eventType,
      eventDate,
      amount: amount === "invalid" ? null : amount,
      currency,
      status,
      sourceNote,
      evidenceReference,
      isActive: input.isActive ?? true
    }
  };
}

export async function getManualAdverseEventsForCompany(companyNumberInput: string): Promise<ManualAdverseServiceResult<ManualAdverseEventsForCompany>> {
  const companyNumber = sanitiseCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  try {
    const pool = getDatabasePool();
    const companyResult = await pool.query<ManualAdverseCompany>(
      `select id, company_number, company_name from companies where company_number = $1`,
      [companyNumber]
    );
    const company = companyResult.rows[0];
    if (!company) {
      return { ok: false, error: { code: "company_not_found", message: "Open the company profile first to create the company record before adding manual adverse data." } };
    }

    const [eventResult, chargesResult] = await Promise.all([
      pool.query<ManualAdverseEventRecord>(
        `select id, company_id, event_type, event_date::text, amount, currency, status,
          source_note, evidence_reference, entered_by, entered_at::text, updated_by,
          updated_at::text, superseded_by_id, is_active
         from manual_adverse_events
         where company_id = $1
         order by is_active desc, event_date desc, entered_at desc`,
        [company.id]
      ),
      pool.query<{
        snapshot_id: string | null;
        source_fetched_at: string | null;
        active_charges: string | number;
        satisfied_charges: string | number;
        latest_charge_date: string | null;
      }>(
        `with latest_snapshot as (
          select id, source_fetched_at
          from company_snapshots
          where company_id = $1
          order by source_fetched_at desc, created_at desc
          limit 1
        )
        select
          latest_snapshot.id as snapshot_id,
          latest_snapshot.source_fetched_at::text,
          count(company_charges.id) filter (where coalesce(company_charges.status, '') not ilike '%satisfied%') as active_charges,
          count(company_charges.id) filter (where coalesce(company_charges.status, '') ilike '%satisfied%') as satisfied_charges,
          max(company_charges.created_on)::text as latest_charge_date
        from latest_snapshot
        left join company_charges on company_charges.snapshot_id = latest_snapshot.id
        group by latest_snapshot.id, latest_snapshot.source_fetched_at`,
        [company.id]
      )
    ]);

    const charges = chargesResult.rows[0];
    return {
      ok: true,
      data: {
        company,
        activeEvents: eventResult.rows.filter((event) => event.is_active && !event.superseded_by_id),
        inactiveEvents: eventResult.rows.filter((event) => !event.is_active || event.superseded_by_id),
        chargesSummary: {
          active: Number(charges?.active_charges ?? 0),
          satisfied: Number(charges?.satisfied_charges ?? 0),
          latestChargeDate: charges?.latest_charge_date ?? null,
          snapshotId: charges?.snapshot_id ?? null,
          sourceFetchedAt: charges?.source_fetched_at ?? null
        }
      }
    };
  } catch (error) {
    return mapManualAdverseError(error, "Manual adverse events could not be loaded.");
  }
}

export async function createManualAdverseEvent(
  companyNumberInput: string,
  input: ManualAdverseEventInput,
  options: ManualAdverseServiceOptions = {}
): Promise<ManualAdverseServiceResult<ManualAdverseEventRecord>> {
  const companyNumber = sanitiseCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  const validated = validateManualAdverseEventInput(input);
  if (!validated.ok) return validated;

  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      await client.query("begin");
      const company = await loadCompany(client, companyNumber);
      if (!company) {
        await client.query("rollback");
        return { ok: false, error: { code: "company_not_found", message: "Open the company profile first to create the company record before adding manual adverse data." } };
      }

      const event = await insertManualEvent(client, company.id, validated.data, options.actorId ?? null);
      await insertManualAuditEvent(client, "manual_adverse_event.created", company.id, event.id, company.company_number, {
        event_type: event.event_type,
        status: event.status,
        created_via: options.createdVia ?? "manual_adverse_event_service"
      }, options.actorId ?? null);
      await client.query("commit");
      return { ok: true, data: event };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return mapManualAdverseError(error, "Manual adverse event could not be created.");
  }
}

export async function supersedeManualAdverseEvent(
  eventId: string,
  input: ManualAdverseEventInput,
  options: ManualAdverseServiceOptions = {}
): Promise<ManualAdverseServiceResult<ManualAdverseEventRecord>> {
  const validated = validateManualAdverseEventInput(input);
  if (!validated.ok) return validated;

  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      await client.query("begin");
      const existing = await loadEvent(client, eventId);
      if (!existing) {
        await client.query("rollback");
        return { ok: false, error: { code: "event_not_found", message: "Manual adverse event was not found." } };
      }

      const company = await loadCompanyById(client, existing.company_id);
      if (!company) {
        await client.query("rollback");
        return { ok: false, error: { code: "company_not_found", message: "Company record was not found for this manual event." } };
      }

      const replacement = await insertManualEvent(client, existing.company_id, validated.data, options.actorId ?? null);
      await client.query(
        `update manual_adverse_events
         set is_active = false, superseded_by_id = $1, updated_by = $2, updated_at = now()
         where id = $3`,
        [replacement.id, options.actorId ?? "anonymous_user", existing.id]
      );
      await insertManualAuditEvent(client, "manual_adverse_event.superseded", existing.company_id, existing.id, company.company_number, {
        replacement_event_id: replacement.id,
        created_via: options.createdVia ?? "manual_adverse_event_service"
      }, options.actorId ?? null);
      await client.query("commit");
      return { ok: true, data: replacement };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return mapManualAdverseError(error, "Manual adverse event could not be superseded.");
  }
}

export async function deactivateManualAdverseEvent(
  eventId: string,
  reason: string,
  options: ManualAdverseServiceOptions = {}
): Promise<ManualAdverseServiceResult<ManualAdverseEventRecord>> {
  const cleanReason = reason.trim();
  if (cleanReason.length < 4) {
    return { ok: false, error: { code: "invalid_input", message: "Provide a short reason before deactivating a manual adverse event.", fieldErrors: { reason: "Reason is required." } } };
  }

  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      await client.query("begin");
      const existing = await loadEvent(client, eventId);
      if (!existing) {
        await client.query("rollback");
        return { ok: false, error: { code: "event_not_found", message: "Manual adverse event was not found." } };
      }

      const result = await client.query<ManualAdverseEventRecord>(
        `update manual_adverse_events
         set is_active = false, updated_by = $1, updated_at = now()
         where id = $2
         returning id, company_id, event_type, event_date::text, amount, currency, status,
          source_note, evidence_reference, entered_by, entered_at::text, updated_by,
          updated_at::text, superseded_by_id, is_active`,
        [options.actorId ?? "anonymous_user", eventId]
      );
      const company = await loadCompanyById(client, existing.company_id);
      await insertManualAuditEvent(client, "manual_adverse_event.deactivated", existing.company_id, eventId, company?.company_number ?? null, {
        reason: cleanReason,
        created_via: options.createdVia ?? "manual_adverse_event_service"
      }, options.actorId ?? null);
      await client.query("commit");
      return { ok: true, data: result.rows[0]! };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return mapManualAdverseError(error, "Manual adverse event could not be deactivated.");
  }
}

function parseAmount(value: string | number | null | undefined): number | null | "invalid" {
  if (value == null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : "invalid";
}

async function loadCompany(client: pg.PoolClient, companyNumber: string): Promise<ManualAdverseCompany | null> {
  const result = await client.query<ManualAdverseCompany>(
    `select id, company_number, company_name from companies where company_number = $1`,
    [companyNumber]
  );
  return result.rows[0] ?? null;
}

async function loadCompanyById(client: pg.PoolClient, companyId: string): Promise<ManualAdverseCompany | null> {
  const result = await client.query<ManualAdverseCompany>(
    `select id, company_number, company_name from companies where id = $1`,
    [companyId]
  );
  return result.rows[0] ?? null;
}

async function loadEvent(client: pg.PoolClient, eventId: string): Promise<ManualAdverseEventRecord | null> {
  const result = await client.query<ManualAdverseEventRecord>(
    `select id, company_id, event_type, event_date::text, amount, currency, status,
      source_note, evidence_reference, entered_by, entered_at::text, updated_by,
      updated_at::text, superseded_by_id, is_active
     from manual_adverse_events
     where id = $1`,
    [eventId]
  );
  return result.rows[0] ?? null;
}

async function insertManualEvent(
  client: pg.PoolClient,
  companyId: string,
  input: ValidatedManualAdverseEventInput,
  actorId: string | null
): Promise<ManualAdverseEventRecord> {
  const result = await client.query<ManualAdverseEventRecord>(
    `insert into manual_adverse_events (
      company_id, event_type, event_date, amount, currency, status, source_note,
      evidence_reference, entered_by, is_active
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    returning id, company_id, event_type, event_date::text, amount, currency, status,
      source_note, evidence_reference, entered_by, entered_at::text, updated_by,
      updated_at::text, superseded_by_id, is_active`,
    [
      companyId,
      input.eventType,
      input.eventDate ?? new Date().toISOString().slice(0, 10),
      input.amount,
      input.currency,
      input.status,
      input.sourceNote,
      input.evidenceReference,
      actorId ?? "anonymous_user",
      input.isActive
    ]
  );
  return result.rows[0]!;
}

async function insertManualAuditEvent(
  client: pg.PoolClient,
  eventType: string,
  companyId: string,
  eventId: string,
  companyNumber: string | null,
  metadata: Record<string, unknown>,
  actorId: string | null
): Promise<void> {
  await client.query(
    `insert into audit_events (
      actor_id, actor_type, event_type, entity_type, entity_id, company_id, metadata_json
    ) values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      actorId,
      actorId ? "user" : "anonymous_user",
      eventType,
      "manual_adverse_event",
      eventId,
      companyId,
      JSON.stringify({ company_number: companyNumber, manual_event_id: eventId, ...metadata })
    ]
  );
}

function mapManualAdverseError<T>(error: unknown, message: string): ManualAdverseServiceResult<T> {
  if (error instanceof DatabaseConfigurationError) {
    return { ok: false, error: { code: "missing_database_url", message: "Database connection is not configured on the server." } };
  }

  return { ok: false, error: { code: "database_error", message } };
}
