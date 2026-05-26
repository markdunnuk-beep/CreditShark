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
  const companyNumber = sanitiseCompanyNumber(companyNumberInput);
  if (!companyNumber) {
    return { ok: false, error: { code: "invalid_company_number", message: "Enter a valid Companies House company number." } };
  }

  const companiesHouse = createCompaniesHouseClient();
  const profileResult = await companiesHouse.getCompanyProfile(companyNumber);
  if (!profileResult.ok) {
    return {
      ok: false,
      error: {
        code: "companies_house_error",
        message: profileResult.error.code === "missing_api_key"
          ? "Companies House API key is not configured on the server."
          : profileResult.error.message
      }
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

  const identity = normaliseCompanyIdentity(profileResult.data);
  const snapshotRow = normaliseCompanySnapshot(profileResult.data, sourceFetchedAt, missingSections);

  try {
    const pool = getDatabasePool();
    const client = await pool.connect();
    try {
      await client.query("begin");

      const company = await upsertCompany(client, identity);
      const snapshot = await insertSnapshot(client, company.id, snapshotRow, options.actorId ?? null);
      await insertFilings(client, company.id, snapshot.id, filings);
      await insertCharges(client, company.id, snapshot.id, charges);
      await insertOfficers(client, company.id, snapshot.id, officers);
      await insertPscs(client, company.id, snapshot.id, pscs);
      await insertAuditEvent(client, company.id, snapshot.id, company.company_number, missingSections, options);

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
    if (error instanceof DatabaseConfigurationError) {
      return { ok: false, error: { code: "missing_database_url", message: "Database connection is not configured on the server." } };
    }

    if (error instanceof DatabaseQueryError || error instanceof Error) {
      return { ok: false, error: { code: "database_error", message: "Company snapshot could not be saved. Check server database configuration and permissions." } };
    }

    return { ok: false, error: { code: "database_error", message: "Company snapshot could not be saved." } };
  }
}

function recordMissing<T>(missingSections: string[], section: string): T[] {
  missingSections.push(section);
  return [];
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
