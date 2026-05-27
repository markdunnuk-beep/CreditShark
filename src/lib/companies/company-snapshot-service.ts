import type pg from "pg";
import { createCompaniesHouseClient } from "../companies-house/client";
import { DatabaseConfigurationError, DatabaseQueryError, getDatabasePool } from "../db/client";
import {
  countCharges,
  normaliseCharge,
  normaliseCompanyIdentity,
  normaliseCompanySnapshot,
  normaliseFiling,
  normaliseOfficer,
  normalisePsc,
  sanitiseCompanyNumber,
  type CompanyChargeRow,
  type CompanyFilingRow,
  type CompanyOfficerRow,
  type CompanyPscRow
} from "./companies-house-normalisers";

export type CompanySnapshotStage =
  | "validate_company_number"
  | "fetch_profile"
  | "fetch_filings"
  | "fetch_charges"
  | "fetch_officers"
  | "fetch_pscs"
  | "upsert_company"
  | "insert_snapshot"
  | "insert_filings"
  | "insert_charges"
  | "insert_officers"
  | "insert_pscs"
  | "insert_audit_event"
  | "run_score_after_snapshot";

export interface CompanySnapshotServiceOptions {
  actorId?: string | null;
  createdVia?: string;
}

export type CompanySnapshotServiceResult =
  | { ok: true; data: CreatedCompanySnapshot }
  | { ok: false; error: CompanySnapshotServiceError };

export interface CompanySnapshotServiceError {
  code: "invalid_company_number" | "missing_database_url" | "companies_house_error" | "database_error";
  message: string;
  stage: CompanySnapshotStage;
  referenceCode: string;
  upstreamStatus?: number;
  details?: string;
}

export interface CreatedCompanySnapshot {
  company: PersistedCompany;
  snapshot: PersistedSnapshot;
  filingsSummary: { count: number };
  chargesSummary: { count: number; active: number; satisfied: number };
  officersSummary: { count: number; current: number };
  pscSummary: { count: number; active: number };
  missingSections: string[];
  sourceFetchedAt: string;
}

export interface PersistedCompany {
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

export interface PersistedSnapshot {
  id: string;
  company_id: string;
  company_number: string;
  source: string;
  source_fetched_at: string;
  derived_status: string | null;
  derived_company_age_months: number | null;
  latest_accounts_date: string | null;
  latest_confirmation_statement_date: string | null;
  snapshot_status: "complete" | "partial" | "failed";
  missing_sections_json: string[];
}

export async function createCompanySnapshotFromCompaniesHouse(
  companyNumberInput: string,
  options: CompanySnapshotServiceOptions = {}
): Promise<CompanySnapshotServiceResult> {
  let stage: CompanySnapshotStage = "validate_company_number";
  const companyNumber = sanitiseCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return {
      ok: false,
      error: buildServiceError("invalid_company_number", stage, companyNumberInput, "Enter a valid Companies House company number.")
    };
  }

  const companiesHouse = createCompaniesHouseClient();
  stage = "fetch_profile";
  const profileResult = await companiesHouse.getCompanyProfile(companyNumber);
  if (!profileResult.ok) {
    logSnapshotDiagnostic(companyNumber, stage, profileResult.error);
    return {
      ok: false,
      error: buildServiceError(
        "companies_house_error",
        stage,
        companyNumber,
        profileResult.error.code === "missing_api_key"
          ? "Companies House API key is not configured on the server."
          : profileResult.error.message,
        { upstreamStatus: profileResult.error.status, details: companiesHouseErrorSummary(profileResult.error) }
      )
    };
  }

  const sourceFetchedAt = new Date().toISOString();
  const [filingsResult, chargesResult, officersResult, pscsResult] = await Promise.all([
    companiesHouse.getCompanyFilingHistory(companyNumber),
    companiesHouse.getCompanyCharges(companyNumber),
    companiesHouse.getCompanyOfficers(companyNumber),
    companiesHouse.getCompanyPscs(companyNumber)
  ]);

  const missingSections: string[] = [];
  const filings: CompanyFilingRow[] = filingsResult.ok ? (filingsResult.data.items ?? []).map(normaliseFiling) : recordMissing(missingSections, "filings");
  const charges: CompanyChargeRow[] = chargesResult.ok ? (chargesResult.data.items ?? []).map(normaliseCharge) : recordMissing(missingSections, "charges");
  const officers: CompanyOfficerRow[] = officersResult.ok
    ? (officersResult.data.items ?? []).map(normaliseOfficer).filter((officer): officer is CompanyOfficerRow => officer !== null)
    : recordMissing(missingSections, "officers");
  const pscs: CompanyPscRow[] = pscsResult.ok
    ? (pscsResult.data.items ?? []).map(normalisePsc).filter((psc): psc is CompanyPscRow => psc !== null)
    : recordMissing(missingSections, "pscs");
  logOptionalFetchFailure(companyNumber, "fetch_filings", filingsResult.ok ? null : filingsResult.error);
  logOptionalFetchFailure(companyNumber, "fetch_charges", chargesResult.ok ? null : chargesResult.error);
  logOptionalFetchFailure(companyNumber, "fetch_officers", officersResult.ok ? null : officersResult.error);
  logOptionalFetchFailure(companyNumber, "fetch_pscs", pscsResult.ok ? null : pscsResult.error);

  const identity = normaliseCompanyIdentity(profileResult.data);
  const snapshotRow = normaliseCompanySnapshot(profileResult.data, sourceFetchedAt, missingSections);

  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      await client.query("begin");

      stage = "upsert_company";
      const company = await upsertCompany(client, identity);
      stage = "insert_snapshot";
      const snapshot = await insertSnapshot(client, company.id, snapshotRow, options.actorId ?? null);
      await insertOptionalSection(client, companyNumber, "insert_filings", "filings", missingSections, () => insertFilings(client, company.id, snapshot.id, filings));
      await insertOptionalSection(client, companyNumber, "insert_charges", "charges", missingSections, () => insertCharges(client, company.id, snapshot.id, charges));
      await insertOptionalSection(client, companyNumber, "insert_officers", "officers", missingSections, () => insertOfficers(client, company.id, snapshot.id, officers));
      await insertOptionalSection(client, companyNumber, "insert_pscs", "pscs", missingSections, () => insertPscs(client, company.id, snapshot.id, pscs));
      stage = "insert_audit_event";
      await insertAuditEventBestEffort(client, company.id, snapshot.id, company.company_number, missingSections, options);

      await client.query("commit");

      const chargeCounts = countCharges(charges);
      return {
        ok: true,
        data: {
          company,
          snapshot,
          filingsSummary: { count: filings.length },
          chargesSummary: { count: charges.length, ...chargeCounts },
          officersSummary: { count: officers.length, current: officers.filter((officer) => !officer.resigned_on).length },
          pscSummary: { count: pscs.length, active: pscs.filter((psc) => !psc.ceased_on).length },
          missingSections,
          sourceFetchedAt
        }
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logSnapshotDiagnostic(companyNumber, stage, error);
    if (error instanceof DatabaseConfigurationError) {
      return {
        ok: false,
        error: buildServiceError("missing_database_url", stage, companyNumber, "Database connection is not configured on the server.")
      };
    }

    if (error instanceof DatabaseQueryError || error instanceof Error) {
      return {
        ok: false,
        error: buildServiceError(
          "database_error",
          stage,
          companyNumber,
          `CreditShark could not save the Companies House snapshot at the ${formatStageForUser(stage)} stage. Please retry or check server logs with reference code ${snapshotReferenceCode(companyNumber, stage)}.`,
          { details: databaseErrorSummary(error) }
        )
      };
    }

    return {
      ok: false,
      error: buildServiceError("database_error", stage, companyNumber, "Company snapshot could not be saved.")
    };
  }
}

function recordMissing<T>(missingSections: string[], section: string): T[] {
  addMissingSection(missingSections, section);
  return [];
}

function addMissingSection(missingSections: string[], section: string): void {
  if (!missingSections.includes(section)) missingSections.push(section);
}

async function insertOptionalSection(
  client: pg.PoolClient,
  companyNumber: string,
  stage: Extract<CompanySnapshotStage, "insert_filings" | "insert_charges" | "insert_officers" | "insert_pscs">,
  section: string,
  missingSections: string[],
  write: () => Promise<void>
): Promise<void> {
  const savepointName = `snapshot_${stage}`;
  await client.query(`savepoint ${savepointName}`);
  try {
    await write();
    await client.query(`release savepoint ${savepointName}`);
  } catch (error) {
    await client.query(`rollback to savepoint ${savepointName}`);
    await client.query(`release savepoint ${savepointName}`);
    addMissingSection(missingSections, section);
    logSnapshotDiagnostic(companyNumber, stage, error);
  }
}

async function insertAuditEventBestEffort(
  client: pg.PoolClient,
  companyId: string,
  snapshotId: string,
  companyNumber: string,
  missingSections: string[],
  options: CompanySnapshotServiceOptions
): Promise<void> {
  const savepointName = "snapshot_insert_audit_event";
  await client.query(`savepoint ${savepointName}`);
  try {
    await insertAuditEvent(client, companyId, snapshotId, companyNumber, missingSections, options);
    await client.query(`release savepoint ${savepointName}`);
  } catch (error) {
    await client.query(`rollback to savepoint ${savepointName}`);
    await client.query(`release savepoint ${savepointName}`);
    logSnapshotDiagnostic(companyNumber, "insert_audit_event", error);
  }
}

async function upsertCompany(client: pg.PoolClient, row: ReturnType<typeof normaliseCompanyIdentity>): Promise<PersistedCompany> {
  const result = await client.query<PersistedCompany>(
    `insert into companies (
      company_number, company_name, company_status, company_type, jurisdiction,
      registered_office_postcode, incorporated_on, dissolved_on, updated_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, now())
    on conflict (company_number) do update set
      company_name = excluded.company_name,
      company_status = excluded.company_status,
      company_type = excluded.company_type,
      jurisdiction = excluded.jurisdiction,
      registered_office_postcode = excluded.registered_office_postcode,
      incorporated_on = excluded.incorporated_on,
      dissolved_on = excluded.dissolved_on,
      updated_at = now()
    returning id, company_number, company_name, company_status, company_type, jurisdiction,
      registered_office_postcode, incorporated_on::text, dissolved_on::text`,
    [
      row.company_number,
      row.company_name,
      row.company_status,
      row.company_type,
      row.jurisdiction,
      row.registered_office_postcode,
      row.incorporated_on,
      row.dissolved_on
    ]
  );

  return result.rows[0]!;
}

async function insertSnapshot(
  client: pg.PoolClient,
  companyId: string,
  row: ReturnType<typeof normaliseCompanySnapshot>,
  actorId: string | null
): Promise<PersistedSnapshot> {
  const result = await client.query<PersistedSnapshot>(
    `insert into company_snapshots (
      company_id, company_number, source, source_fetched_at, raw_profile_json,
      derived_status, derived_company_age_months, latest_accounts_date,
      latest_confirmation_statement_date, snapshot_status, missing_sections_json, created_by
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    returning id, company_id, company_number, source, source_fetched_at::text, derived_status,
      derived_company_age_months, latest_accounts_date::text, latest_confirmation_statement_date::text,
      snapshot_status, missing_sections_json`,
    [
      companyId,
      row.company_number,
      row.source,
      row.source_fetched_at,
      row.raw_profile_json,
      row.derived_status,
      row.derived_company_age_months,
      row.latest_accounts_date,
      row.latest_confirmation_statement_date,
      row.snapshot_status,
      JSON.stringify(row.missing_sections_json),
      actorId
    ]
  );

  return result.rows[0]!;
}

async function insertFilings(client: pg.PoolClient, companyId: string, snapshotId: string, rows: CompanyFilingRow[]): Promise<void> {
  for (const row of rows) {
    await client.query(
      `insert into company_filings (
        snapshot_id, company_id, filing_type, description, filing_date, made_up_date,
        category, barcode, source_url, raw_json
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [snapshotId, companyId, row.filing_type, row.description, row.filing_date, row.made_up_date, row.category, row.barcode, row.source_url, row.raw_json]
    );
  }
}

async function insertCharges(client: pg.PoolClient, companyId: string, snapshotId: string, rows: CompanyChargeRow[]): Promise<void> {
  for (const row of rows) {
    await client.query(
      `insert into company_charges (
        snapshot_id, company_id, charge_number, status, created_on, delivered_on,
        satisfied_on, persons_entitled, classification, source_url, raw_json
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        snapshotId,
        companyId,
        row.charge_number,
        row.status,
        row.created_on,
        row.delivered_on,
        row.satisfied_on,
        row.persons_entitled,
        row.classification,
        row.source_url,
        row.raw_json
      ]
    );
  }
}

async function insertOfficers(client: pg.PoolClient, companyId: string, snapshotId: string, rows: CompanyOfficerRow[]): Promise<void> {
  for (const row of rows) {
    await client.query(
      `insert into company_officers (
        snapshot_id, company_id, officer_name, officer_role, appointed_on, resigned_on,
        nationality, occupation, country_of_residence, date_of_birth_partial, source_id, raw_json
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        snapshotId,
        companyId,
        row.officer_name,
        row.officer_role,
        row.appointed_on,
        row.resigned_on,
        row.nationality,
        row.occupation,
        row.country_of_residence,
        row.date_of_birth_partial,
        row.source_id,
        row.raw_json
      ]
    );
  }
}

async function insertPscs(client: pg.PoolClient, companyId: string, snapshotId: string, rows: CompanyPscRow[]): Promise<void> {
  for (const row of rows) {
    await client.query(
      `insert into company_pscs (
        snapshot_id, company_id, psc_name, psc_kind, notified_on, ceased_on,
        natures_of_control, country_of_residence, source_id, raw_json
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        snapshotId,
        companyId,
        row.psc_name,
        row.psc_kind,
        row.notified_on,
        row.ceased_on,
        JSON.stringify(row.natures_of_control),
        row.country_of_residence,
        row.source_id,
        row.raw_json
      ]
    );
  }
}

function buildServiceError(
  code: CompanySnapshotServiceError["code"],
  stage: CompanySnapshotStage,
  companyNumber: string,
  message: string,
  options: { upstreamStatus?: number; details?: string } = {}
): CompanySnapshotServiceError {
  return {
    code,
    message,
    stage,
    referenceCode: snapshotReferenceCode(companyNumber, stage),
    upstreamStatus: options.upstreamStatus,
    details: options.details
  };
}

function snapshotReferenceCode(companyNumber: string, stage: CompanySnapshotStage): string {
  const safeCompany = sanitiseCompanyNumber(companyNumber) ?? "UNKNOWN";
  const suffix = Math.abs(hashString(`${safeCompany}:${stage}`)).toString(36).toUpperCase().slice(0, 6).padStart(6, "0");
  return `CS-${safeCompany}-${suffix}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return hash;
}

function formatStageForUser(stage: CompanySnapshotStage): string {
  return stage.replace(/^insert_/, "").replace(/^fetch_/, "").replace(/_/g, " ");
}

function logOptionalFetchFailure(companyNumber: string, stage: CompanySnapshotStage, error: unknown): void {
  if (!error) return;
  logSnapshotDiagnostic(companyNumber, stage, error);
}

function logSnapshotDiagnostic(companyNumber: string, stage: CompanySnapshotStage, error: unknown): void {
  console.error("[creditshark.snapshot]", {
    company_number: sanitiseCompanyNumber(companyNumber) ?? "invalid",
    stage,
    reference_code: snapshotReferenceCode(companyNumber, stage),
    ...safeErrorDetails(error)
  });
}

function safeErrorDetails(error: unknown): Record<string, unknown> {
  if (!error || typeof error !== "object") {
    return { error_name: "UnknownError" };
  }

  const record = error as Record<string, unknown>;
  return {
    error_name: record.name ?? record.code ?? "Error",
    error_code: record.errorCode ?? record.code,
    table: record.table,
    constraint: record.constraint,
    upstream_status: record.status,
    endpoint: record.endpoint,
    hostname: record.hostname,
    pathname: record.pathname,
    detail: typeof record.detail === "string" ? record.detail.slice(0, 300) : undefined
  };
}

function databaseErrorSummary(error: unknown): string | undefined {
  const details = safeErrorDetails(error);
  const parts = [details.error_code, details.table, details.constraint].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function companiesHouseErrorSummary(error: {
  code: string;
  endpoint?: string;
  hostname?: string;
  pathname?: string;
  errorName?: string;
  errorCode?: string;
}): string {
  return [
    error.code,
    error.endpoint ? `endpoint=${error.endpoint}` : null,
    error.hostname ? `host=${error.hostname}` : null,
    error.pathname ? `path=${error.pathname}` : null,
    error.errorName ? `error=${error.errorName}` : null,
    error.errorCode ? `error_code=${error.errorCode}` : null
  ].filter(Boolean).join(" ");
}

async function insertAuditEvent(
  client: pg.PoolClient,
  companyId: string,
  snapshotId: string,
  companyNumber: string,
  missingSections: string[],
  options: CompanySnapshotServiceOptions
): Promise<void> {
  const metadata = {
    company_number: companyNumber,
    snapshot_id: snapshotId,
    source: "companies_house",
    fetched_sections: ["profile", "filings", "charges", "officers", "pscs"].filter((section) => !missingSections.includes(section)),
    failed_sections: missingSections,
    created_via: options.createdVia ?? "company_profile_route"
  };

  await client.query(
    `insert into audit_events (
      actor_id, actor_type, event_type, entity_type, entity_id, company_id, metadata_json
    ) values ($1, $2, $3, $4, $5, $6, $7)`,
    [options.actorId ?? null, options.actorId ? "user" : "anonymous_user", "company.snapshot.created", "company_snapshot", snapshotId, companyId, JSON.stringify(metadata)]
  );
}
