create extension if not exists pgcrypto;

create or replace function prevent_update_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception 'table % is append-only or immutable', tg_table_name;
end;
$$;

create or replace function prevent_published_scoring_model_update()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'published' then
    raise exception 'published scoring model versions are immutable';
  end if;
  return new;
end;
$$;

create table companies (
  id uuid primary key default gen_random_uuid(),
  company_number text not null unique,
  company_name text not null,
  company_status text,
  company_type text,
  jurisdiction text,
  registered_office_postcode text,
  incorporated_on date,
  dissolved_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table scoring_model_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  status text not null check (status in ('draft', 'published', 'retired')),
  effective_from timestamptz,
  effective_to timestamptz,
  band_thresholds_json jsonb not null,
  factor_weights_json jsonb not null,
  limit_rules_json jsonb not null,
  change_note text not null,
  created_by text,
  created_at timestamptz not null default now(),
  published_by text,
  published_at timestamptz
);

create table company_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  company_number text not null,
  source text not null default 'companies_house',
  source_fetched_at timestamptz not null,
  raw_profile_json jsonb,
  derived_status text,
  derived_company_age_months integer,
  latest_accounts_date date,
  latest_confirmation_statement_date date,
  snapshot_status text not null default 'complete' check (snapshot_status in ('complete', 'partial', 'failed')),
  missing_sections_json jsonb not null default '[]'::jsonb,
  created_by text,
  created_at timestamptz not null default now()
);

create table company_filings (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references company_snapshots(id),
  company_id uuid not null references companies(id),
  filing_type text,
  description text,
  filing_date date,
  made_up_date date,
  category text,
  barcode text,
  source_url text,
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create table company_accounts (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references company_snapshots(id),
  company_id uuid not null references companies(id),
  period_start date,
  period_end date,
  accounts_type text,
  currency text,
  turnover numeric(18, 2),
  profit_before_tax numeric(18, 2),
  profit_after_tax numeric(18, 2),
  net_assets numeric(18, 2),
  cash numeric(18, 2),
  total_liabilities numeric(18, 2),
  employees integer,
  is_consolidated boolean,
  extraction_method text,
  source_filing_id uuid references company_filings(id),
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create table company_charges (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references company_snapshots(id),
  company_id uuid not null references companies(id),
  charge_number text,
  status text,
  created_on date,
  delivered_on date,
  satisfied_on date,
  persons_entitled text,
  classification text,
  source_url text,
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create table company_officers (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references company_snapshots(id),
  company_id uuid not null references companies(id),
  officer_name text not null,
  officer_role text,
  appointed_on date,
  resigned_on date,
  nationality text,
  occupation text,
  country_of_residence text,
  date_of_birth_partial text,
  source_id text,
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create table company_pscs (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references company_snapshots(id),
  company_id uuid not null references companies(id),
  psc_name text not null,
  psc_kind text,
  notified_on date,
  ceased_on date,
  natures_of_control jsonb,
  country_of_residence text,
  source_id text,
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create table manual_adverse_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  event_type text not null,
  event_date date not null,
  amount numeric(18, 2),
  currency text not null default 'GBP',
  status text not null,
  source_note text not null,
  evidence_reference text,
  entered_by text not null,
  entered_at timestamptz not null default now(),
  updated_by text,
  updated_at timestamptz,
  superseded_by_id uuid references manual_adverse_events(id),
  is_active boolean not null default true
);

create table score_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  snapshot_id uuid not null references company_snapshots(id),
  model_version_id uuid not null references scoring_model_versions(id),
  score integer check (score between 0 and 100),
  risk_band text not null,
  confidence_level text not null,
  recommended_limit numeric(18, 2) not null default 0,
  currency text not null default 'GBP',
  manual_override_state text not null,
  missing_data_flags_json jsonb not null default '[]'::jsonb,
  input_summary_json jsonb not null default '{}'::jsonb,
  run_by text,
  run_at timestamptz not null default now()
);

create table score_reason_codes (
  id uuid primary key default gen_random_uuid(),
  score_run_id uuid not null references score_runs(id),
  code text not null,
  label text not null,
  "group" text not null,
  direction text not null check (direction in ('positive', 'negative', 'neutral', 'missing')),
  weight numeric(10, 2) not null,
  impact text not null,
  source_type text not null,
  source_id text,
  source_date date,
  explanation text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table credit_recommendations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  score_run_id uuid not null references score_runs(id),
  recommended_limit numeric(18, 2) not null,
  requested_limit numeric(18, 2),
  currency text not null default 'GBP',
  basis text not null,
  limit_cap_reason text,
  created_at timestamptz not null default now()
);

create table decision_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  score_run_id uuid not null references score_runs(id),
  credit_recommendation_id uuid references credit_recommendations(id),
  decision text not null check (decision in ('approve', 'refer', 'reject')),
  approved_limit numeric(18, 2),
  requested_limit numeric(18, 2),
  currency text not null default 'GBP',
  reviewer_notes text,
  override_reason text,
  decided_by text not null,
  decided_at timestamptz not null default now()
);

create table report_exports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  snapshot_id uuid not null references company_snapshots(id),
  score_run_id uuid not null references score_runs(id),
  decision_record_id uuid references decision_records(id),
  report_type text not null,
  file_path text,
  file_hash text,
  exported_by text not null,
  exported_at timestamptz not null default now(),
  included_sections_json jsonb not null default '[]'::jsonb
);

create table audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id text,
  actor_type text not null default 'user',
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  company_id uuid references companies(id),
  metadata_json jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table sic_risk_weights (
  id uuid primary key default gen_random_uuid(),
  sic_code text not null,
  sector_label text not null,
  risk_weight numeric(10, 2) not null,
  rationale text not null,
  model_version_id uuid not null references scoring_model_versions(id),
  is_active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  unique (sic_code, model_version_id)
);

create index idx_company_snapshots_company_id on company_snapshots(company_id);
create index idx_company_filings_snapshot_id on company_filings(snapshot_id);
create index idx_company_accounts_snapshot_id on company_accounts(snapshot_id);
create index idx_company_charges_snapshot_id on company_charges(snapshot_id);
create index idx_company_officers_snapshot_id on company_officers(snapshot_id);
create index idx_company_pscs_snapshot_id on company_pscs(snapshot_id);
create index idx_manual_adverse_events_company_active on manual_adverse_events(company_id, is_active);
create index idx_score_runs_company_id on score_runs(company_id);
create index idx_score_runs_snapshot_id on score_runs(snapshot_id);
create index idx_score_reason_codes_score_run_id on score_reason_codes(score_run_id);
create index idx_decision_records_company_id on decision_records(company_id);
create index idx_report_exports_company_id on report_exports(company_id);
create index idx_audit_events_company_id on audit_events(company_id);
create index idx_audit_events_entity on audit_events(entity_type, entity_id);

create trigger immutable_company_snapshots_update
before update or delete on company_snapshots
for each row execute function prevent_update_delete();

create trigger immutable_score_runs_update
before update or delete on score_runs
for each row execute function prevent_update_delete();

create trigger immutable_score_reason_codes_update
before update or delete on score_reason_codes
for each row execute function prevent_update_delete();

create trigger immutable_report_exports_update
before update or delete on report_exports
for each row execute function prevent_update_delete();

create trigger append_only_audit_events_update
before update or delete on audit_events
for each row execute function prevent_update_delete();

create trigger immutable_published_scoring_model_versions
before update or delete on scoring_model_versions
for each row execute function prevent_published_scoring_model_update();

insert into scoring_model_versions (
  version,
  status,
  effective_from,
  band_thresholds_json,
  factor_weights_json,
  limit_rules_json,
  change_note,
  created_by,
  published_by,
  published_at
) values (
  '1.0.0',
  'published',
  now(),
  '{
    "veryLowRisk": { "min": 81, "max": 100 },
    "lowRisk": { "min": 61, "max": 80 },
    "moderateRisk": { "min": 41, "max": 60 },
    "highRisk": { "min": 21, "max": 40 },
    "veryHighRisk": { "min": 1, "max": 20 },
    "notScored": null
  }'::jsonb,
  '{
    "baseline": 60,
    "companyStatus": { "active": 10, "dissolvedHardStop": true, "insolvencyHardStop": true },
    "companyAge": { "established": 8, "newCompany": -12, "veryNewCompany": -18 },
    "filingBehaviour": { "current": 8, "accountsOverdue": -15, "confirmationStatementOverdue": -10, "limitedAccountsData": -6 },
    "financialStrength": { "strongNetAssets": 10, "negativeNetAssets": -15, "missingFinancials": -8 },
    "charges": { "activeCharge": -6, "recentCharge": -8, "satisfiedCharge": -1 },
    "manualAdverseEvents": { "recentUnsatisfiedMaterial": -25, "satisfiedOrOld": -8, "reviewThreshold": 10000 },
    "directorPscSignals": { "officerChurn": -4, "pscUnavailable": -3 },
    "sicSector": { "default": 0 },
    "dataCompleteness": { "missingCriticalSection": -10, "staleSnapshot": -6 }
  }'::jsonb,
  '{
    "currency": "GBP",
    "defaultLimits": {
      "veryLowRisk": 25000,
      "lowRisk": 10000,
      "moderateRisk": 2500,
      "highRisk": 500,
      "veryHighRisk": 0,
      "notScored": 0
    },
    "confidenceCaps": {
      "high": null,
      "medium": 10000,
      "low": 1000,
      "insufficient": 0
    },
    "newCompanyCap": 1000,
    "manualReviewCap": 0
  }'::jsonb,
  'Initial MVP scoring model',
  'system',
  'system',
  now()
);

