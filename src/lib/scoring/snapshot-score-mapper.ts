import { countCharges, sanitiseCompanyNumber } from "../companies/companies-house-normalisers";
import type { CompanySnapshot, ManualAdverseEvent } from "../../types/creditshark";

export interface PersistedCompanyForScore {
  id: string;
  company_number: string;
  company_name: string;
  company_status: string | null;
  company_type: string | null;
  incorporated_on: string | null;
  dissolved_on: string | null;
}

export interface PersistedSnapshotForScore {
  id: string;
  company_id: string;
  company_number: string;
  source_fetched_at: string;
  derived_status: string | null;
  derived_company_age_months: number | null;
  latest_accounts_date: string | null;
  latest_confirmation_statement_date: string | null;
  missing_sections_json: string[] | null;
  raw_profile_json?: {
    sic_codes?: string[];
    has_insolvency_history?: boolean;
  } | null;
}

export interface PersistedAccountForScore {
  id: string;
  period_end: string | null;
  accounts_type: string | null;
  currency: string | null;
  turnover: string | number | null;
  profit_before_tax: string | number | null;
  profit_after_tax: string | number | null;
  net_assets: string | number | null;
  cash: string | number | null;
  total_liabilities: string | number | null;
  employees: number | null;
  extraction_method: string | null;
}

export interface PersistedChargeForScore {
  id: string;
  status: string | null;
  created_on: string | null;
  satisfied_on: string | null;
}

export interface PersistedOfficerForScore {
  id: string;
  officer_name: string;
  officer_role: string | null;
  appointed_on: string | null;
  resigned_on: string | null;
}

export interface PersistedPscForScore {
  id: string;
  psc_name: string;
  psc_kind: string | null;
  ceased_on: string | null;
}

export interface SnapshotScoreEvidence {
  company: PersistedCompanyForScore;
  snapshot: PersistedSnapshotForScore;
  accounts: PersistedAccountForScore[];
  charges: PersistedChargeForScore[];
  officers: PersistedOfficerForScore[];
  pscs: PersistedPscForScore[];
}

export function mapSnapshotEvidenceToScoreInput(evidence: SnapshotScoreEvidence): CompanySnapshot {
  return {
    id: evidence.snapshot.id,
    companyId: evidence.company.id,
    companyNumber: evidence.company.company_number,
    companyName: evidence.company.company_name,
    sourceFetchedAt: evidence.snapshot.source_fetched_at,
    derivedStatus: evidence.snapshot.derived_status ?? evidence.company.company_status ?? undefined,
    companyStatus: evidence.company.company_status ?? undefined,
    companyType: evidence.company.company_type ?? undefined,
    incorporatedOn: evidence.company.incorporated_on ?? undefined,
    dissolvedOn: evidence.company.dissolved_on ?? undefined,
    derivedCompanyAgeMonths: evidence.snapshot.derived_company_age_months ?? undefined,
    latestAccountsDate: evidence.snapshot.latest_accounts_date ?? undefined,
    latestConfirmationStatementDate: evidence.snapshot.latest_confirmation_statement_date ?? undefined,
    hasInsolvencyHistory: evidence.snapshot.raw_profile_json?.has_insolvency_history ?? false,
    sicCodes: evidence.snapshot.raw_profile_json?.sic_codes ?? [],
    missingSections: evidence.snapshot.missing_sections_json ?? [],
    accounts: evidence.accounts.map((account) => ({
      id: account.id,
      periodEnd: account.period_end ?? undefined,
      accountsType: account.accounts_type ?? undefined,
      currency: account.currency ?? undefined,
      turnover: nullableNumber(account.turnover),
      profitBeforeTax: nullableNumber(account.profit_before_tax),
      profitAfterTax: nullableNumber(account.profit_after_tax),
      netAssets: nullableNumber(account.net_assets),
      cash: nullableNumber(account.cash),
      totalLiabilities: nullableNumber(account.total_liabilities),
      employees: account.employees ?? undefined,
      extractionMethod: account.extraction_method ?? undefined
    })),
    charges: evidence.charges.map((charge) => ({
      id: charge.id,
      status: charge.status ?? undefined,
      createdOn: charge.created_on ?? undefined,
      satisfiedOn: charge.satisfied_on ?? undefined
    })),
    officers: evidence.officers.map((officer) => ({
      id: officer.id,
      officerName: officer.officer_name,
      officerRole: officer.officer_role ?? undefined,
      appointedOn: officer.appointed_on ?? undefined,
      resignedOn: officer.resigned_on ?? undefined
    })),
    pscs: evidence.pscs.map((psc) => ({
      id: psc.id,
      pscName: psc.psc_name,
      pscKind: psc.psc_kind ?? undefined,
      ceasedOn: psc.ceased_on ?? undefined
    }))
  };
}

export function mapManualAdverseEventRow(row: {
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
}): ManualAdverseEvent {
  return {
    id: row.id,
    companyId: row.company_id,
    eventType: row.event_type,
    eventDate: row.event_date,
    amount: nullableNumber(row.amount),
    currency: row.currency,
    status: row.status,
    sourceNote: row.source_note,
    evidenceReference: row.evidence_reference ?? undefined,
    enteredBy: row.entered_by,
    enteredAt: row.entered_at,
    supersededById: row.superseded_by_id ?? undefined,
    isActive: row.is_active
  };
}

export function countPersistedCharges(charges: PersistedChargeForScore[]): { active: number; satisfied: number } {
  return countCharges(charges.map((charge) => ({
    charge_number: null,
    status: charge.status,
    created_on: charge.created_on,
    delivered_on: null,
    satisfied_on: charge.satisfied_on,
    persons_entitled: null,
    classification: null,
    source_url: null,
    raw_json: {}
  })));
}

export function validateScoreCompanyNumber(input: string): string | null {
  return sanitiseCompanyNumber(input);
}

function nullableNumber(value: string | number | null): number | undefined {
  if (value == null) return undefined;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
