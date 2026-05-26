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
    company_number: profile.company_number,
    company_name: profile.company_name,
    company_status: profile.company_status ?? null,
    company_type: profile.company_type ?? null,
    jurisdiction: profile.jurisdiction ?? null,
    registered_office_postcode: profile.registered_office_address?.postal_code ?? null,
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
    company_number: profile.company_number,
    source: "companies_house",
    source_fetched_at: sourceFetchedAt,
    raw_profile_json: profile,
    derived_status: profile.company_status ?? null,
    derived_company_age_months: calculateCompanyAgeMonths(profile.date_of_creation, sourceFetchedAt),
    latest_accounts_date: validDate(profile.accounts?.last_accounts?.made_up_to),
    latest_confirmation_statement_date: validDate(profile.confirmation_statement?.last_made_up_to),
    snapshot_status: missingSections.length > 0 ? "partial" : "complete",
    missing_sections_json: missingSections
  };
}

export function normaliseFiling(filing: CompaniesHouseFiling): CompanyFilingRow {
  return {
    filing_type: filing.type ?? null,
    description: filing.description ?? null,
    filing_date: validDate(filing.date),
    made_up_date: validDate(filing.description_values?.made_up_date),
    category: filing.category ?? null,
    barcode: filing.barcode ?? null,
    source_url: filing.links?.document_metadata ?? filing.links?.self ?? null,
    raw_json: filing
  };
}

export function normaliseCharge(charge: CompaniesHouseCharge): CompanyChargeRow {
  return {
    charge_number: charge.charge_number == null ? null : String(charge.charge_number),
    status: charge.status ?? null,
    created_on: validDate(charge.created_on),
    delivered_on: validDate(charge.delivered_on),
    satisfied_on: validDate(charge.satisfied_on),
    persons_entitled: charge.persons_entitled?.map((person) => person.name).filter(Boolean).join("; ") || null,
    classification: charge.classification?.description ?? charge.classification?.type ?? null,
    source_url: charge.links?.self ?? null,
    raw_json: charge
  };
}

export function normaliseOfficer(officer: CompaniesHouseOfficer): CompanyOfficerRow | null {
  if (!officer.name) return null;

  return {
    officer_name: officer.name,
    officer_role: officer.officer_role ?? null,
    appointed_on: validDate(officer.appointed_on),
    resigned_on: validDate(officer.resigned_on),
    nationality: officer.nationality ?? null,
    occupation: officer.occupation ?? null,
    country_of_residence: officer.country_of_residence ?? null,
    date_of_birth_partial: formatPartialDateOfBirth(officer.date_of_birth),
    source_id: officer.links?.self ?? null,
    raw_json: officer
  };
}

export function normalisePsc(psc: CompaniesHousePsc): CompanyPscRow | null {
  if (!psc.name) return null;

  return {
    psc_name: psc.name,
    psc_kind: psc.kind ?? null,
    notified_on: validDate(psc.notified_on),
    ceased_on: validDate(psc.ceased_on),
    natures_of_control: psc.natures_of_control ?? [],
    country_of_residence: psc.country_of_residence ?? null,
    source_id: psc.links?.self ?? null,
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
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function formatPartialDateOfBirth(dateOfBirth: { month?: number; year?: number } | undefined): string | null {
  if (!dateOfBirth?.year) return null;
  return dateOfBirth.month ? `${dateOfBirth.year}-${String(dateOfBirth.month).padStart(2, "0")}` : String(dateOfBirth.year);
}
