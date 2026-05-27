import type {
  CompaniesHouseCharge,
  CompaniesHouseFiling,
  CompaniesHouseOfficer,
  CompaniesHouseProfile,
  CompaniesHousePsc
} from "../../types/companies-house.js";

export interface CompanyIdentityRow {
  company_number: string;
  company_name: string;
  company_status: string | null;
  company_type: string | null;
  jurisdiction: string | null;
  registered_office_postcode: string | null;
  incorporated_on: string | null;
  dissolved_on: string | null;
}

export interface CompanySnapshotRow {
  company_number: string;
  source: "companies_house";
  source_fetched_at: string;
  raw_profile_json: CompaniesHouseProfile;
  derived_status: string | null;
  derived_company_age_months: number | null;
  latest_accounts_date: string | null;
  latest_confirmation_statement_date: string | null;
  snapshot_status: "complete" | "partial" | "failed";
  missing_sections_json: string[];
}

export interface CompanyFilingRow {
  filing_type: string | null;
  description: string | null;
  filing_date: string | null;
  made_up_date: string | null;
  category: string | null;
  barcode: string | null;
  source_url: string | null;
  raw_json: CompaniesHouseFiling;
}

export interface CompanyChargeRow {
  charge_number: string | null;
  status: string | null;
  created_on: string | null;
  delivered_on: string | null;
  satisfied_on: string | null;
  persons_entitled: string | null;
  classification: string | null;
  source_url: string | null;
  raw_json: CompaniesHouseCharge;
}

export interface CompanyOfficerRow {
  officer_name: string;
  officer_role: string | null;
  appointed_on: string | null;
  resigned_on: string | null;
  nationality: string | null;
  occupation: string | null;
  country_of_residence: string | null;
  date_of_birth_partial: string | null;
  source_id: string | null;
  raw_json: CompaniesHouseOfficer;
}

export interface CompanyPscRow {
  psc_name: string;
  psc_kind: string | null;
  notified_on: string | null;
  ceased_on: string | null;
  natures_of_control: string[];
  country_of_residence: string | null;
  source_id: string | null;
  raw_json: CompaniesHousePsc;
}

export function sanitiseCompanyNumber(input: string): string | null {
  const cleaned = input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return /^(?=.*\d)[A-Z0-9]{2,10}$/.test(cleaned) ? cleaned : null;
}

export function normaliseCompanyIdentity(profile: CompaniesHouseProfile): CompanyIdentityRow {
  return {
    company_number: textOrNull(profile.company_number, 32) ?? "",
    company_name: textOrNull(profile.company_name, 500) ?? "Unknown company",
    company_status: textOrNull(profile.company_status, 100),
    company_type: textOrNull(profile.company_type, 100),
    jurisdiction: textOrNull(profile.jurisdiction, 100),
    registered_office_postcode: textOrNull(profile.registered_office_address?.postal_code, 50),
    incorporated_on: validDate(profile.date_of_creation),
    dissolved_on: validDate(profile.date_of_cessation)
  };
}

export function normaliseCompanySnapshot(
  profile: CompaniesHouseProfile,
  sourceFetchedAt: string,
  missingSections: string[]
): CompanySnapshotRow {
  return {
    company_number: textOrNull(profile.company_number, 32) ?? "",
    source: "companies_house",
    source_fetched_at: sourceFetchedAt,
    raw_profile_json: profile,
    derived_status: textOrNull(profile.company_status, 100),
    derived_company_age_months: calculateCompanyAgeMonths(profile.date_of_creation, sourceFetchedAt),
    latest_accounts_date: validDate(profile.accounts?.last_accounts?.made_up_to),
    latest_confirmation_statement_date: validDate(profile.confirmation_statement?.last_made_up_to),
    snapshot_status: missingSections.length > 0 ? "partial" : "complete",
    missing_sections_json: missingSections
  };
}

export function normaliseFiling(filing: CompaniesHouseFiling): CompanyFilingRow {
  return {
    filing_type: textOrNull(filing.type, 100),
    description: textOrNull(filing.description, 1000),
    filing_date: validDate(filing.date),
    made_up_date: validDate(filing.description_values?.made_up_date),
    category: textOrNull(filing.category, 100),
    barcode: textOrNull(filing.barcode, 100),
    source_url: textOrNull(filing.links?.document_metadata ?? filing.links?.self, 1000),
    raw_json: filing
  };
}

export function normaliseCharge(charge: CompaniesHouseCharge): CompanyChargeRow {
  return {
    charge_number: textOrNull(charge.charge_number == null ? null : String(charge.charge_number), 100),
    status: textOrNull(charge.status, 100),
    created_on: validDate(charge.created_on),
    delivered_on: validDate(charge.delivered_on),
    satisfied_on: validDate(charge.satisfied_on),
    persons_entitled: textOrNull(charge.persons_entitled?.map((person) => person.name).filter(Boolean).join("; "), 2000),
    classification: textOrNull(charge.classification?.description ?? charge.classification?.type, 500),
    source_url: textOrNull(charge.links?.self, 1000),
    raw_json: charge
  };
}

export function normaliseOfficer(officer: CompaniesHouseOfficer): CompanyOfficerRow | null {
  const officerName = textOrNull(officer.name, 500);
  if (!officerName) return null;

  return {
    officer_name: officerName,
    officer_role: textOrNull(officer.officer_role, 100),
    appointed_on: validDate(officer.appointed_on),
    resigned_on: validDate(officer.resigned_on),
    nationality: textOrNull(officer.nationality, 100),
    occupation: textOrNull(officer.occupation, 500),
    country_of_residence: textOrNull(officer.country_of_residence, 100),
    date_of_birth_partial: formatPartialDateOfBirth(officer.date_of_birth),
    source_id: textOrNull(officer.links?.self, 1000),
    raw_json: officer
  };
}

export function normalisePsc(psc: CompaniesHousePsc): CompanyPscRow | null {
  const pscName = textOrNull(psc.name, 500);
  if (!pscName) return null;

  return {
    psc_name: pscName,
    psc_kind: textOrNull(psc.kind, 100),
    notified_on: validDate(psc.notified_on),
    ceased_on: validDate(psc.ceased_on),
    natures_of_control: (psc.natures_of_control ?? []).map((value) => textOrNull(value, 300)).filter((value): value is string => value !== null),
    country_of_residence: textOrNull(psc.country_of_residence, 100),
    source_id: textOrNull(psc.links?.self, 1000),
    raw_json: psc
  };
}

export function calculateCompanyAgeMonths(incorporatedOn: string | undefined, asOf: string): number | null {
  if (!incorporatedOn) return null;

  const start = new Date(incorporatedOn);
  const end = new Date(asOf);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;

  let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() < start.getUTCDate()) months -= 1;
  return Math.max(0, months);
}

export function countCharges(charges: CompanyChargeRow[]): { active: number; satisfied: number } {
  return charges.reduce(
    (counts, charge) => {
      const status = (charge.status ?? "").toLowerCase();
      if (status.includes("satisfied")) counts.satisfied += 1;
      else counts.active += 1;
      return counts;
    },
    { active: 0, satisfied: 0 }
  );
}

function validDate(value: string | undefined): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value ? null : value;
}

function formatPartialDateOfBirth(dateOfBirth: { month?: number; year?: number } | undefined): string | null {
  if (!dateOfBirth?.year) return null;
  if (!Number.isInteger(dateOfBirth.year) || dateOfBirth.year < 1800 || dateOfBirth.year > 2200) return null;
  if (dateOfBirth.month == null) return String(dateOfBirth.year);
  if (!Number.isInteger(dateOfBirth.month) || dateOfBirth.month < 1 || dateOfBirth.month > 12) return null;
  return `${dateOfBirth.year}-${String(dateOfBirth.month).padStart(2, "0")}`;
}

function textOrNull(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}
