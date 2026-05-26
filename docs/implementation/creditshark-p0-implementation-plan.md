# CreditShark P0 Technical Implementation Plan

## 1. Recommended App Stack

The workspace currently contains documentation only. No web framework, package manifest, source tree, or database configuration is present.

Recommended stack to scaffold next:

- Next.js App Router with TypeScript for the web app.
- Postgres for durable data.
- SQL migrations kept in `database/migrations`.
- Server-side Companies House API access only.
- Deterministic scoring as a pure TypeScript domain module.
- PDF generation behind a server-only report service in a later P0 slice.
- Node test runner through `tsx --test` for domain and client tests.

This foundation slice deliberately avoids UI scaffolding and implements only schema, types, client interfaces, guardrail copy, scoring skeleton, and tests.

## 2. Database Choice and Migration Strategy

Use Postgres.

Rationale:

- Strong relational integrity for companies, snapshots, score runs, reason codes, decisions, and exports.
- `jsonb` support for raw Companies House payloads, scoring inputs, missing-data flags, model weights, and report section metadata.
- Trigger support for immutability and append-only audit rules.

Migration strategy:

- Store SQL migrations under `database/migrations`.
- Use monotonic numeric prefixes.
- Keep schema migrations and seed/reference data in versioned SQL.
- Make published scoring model versions immutable.
- Make company snapshots, score runs, score reason codes, report exports, and audit events append-only.
- Supersede manual adverse events rather than deleting them.

## 3. Environment Variables

Required:

- `COMPANIES_HOUSE_API_KEY`: Companies House API key for Basic auth.

Recommended for app scaffold:

- `DATABASE_URL`: Postgres connection string.
- `APP_BASE_URL`: Canonical app URL for report links.
- `REPORT_STORAGE_PATH` or object-storage configuration.
- `NODE_ENV`.

Optional later:

- `EMAIL_FROM`.
- `EMAIL_PROVIDER_API_KEY`.
- `MONITORING_CRON_SECRET`.

## 4. Companies House API Client Design

Module: `src/lib/companies-house/client.ts`

Design:

- Server-side only.
- Reads API key from environment by default.
- Supports explicit constructor injection for tests.
- Uses Basic auth with API key as username and blank password.
- Uses `AbortSignal.timeout`/manual timeout handling.
- Returns typed success/error results instead of throwing for expected API errors.
- Normalises rate-limit and upstream error shape.
- Does not hardcode secrets.

Functions:

- `searchCompanies(query)`
- `getCompanyProfile(companyNumber)`
- `getCompanyFilingHistory(companyNumber)`
- `getCompanyCharges(companyNumber)`
- `getCompanyOfficers(companyNumber)`
- `getCompanyPscs(companyNumber)`

## 5. Data Ingestion Flow

1. User searches by company number or name.
2. App calls Companies House search.
3. User selects a company.
4. App creates or updates durable `companies` identity.
5. User or system requests refresh.
6. App fetches profile, filing history, charges, officers, and PSCs.
7. App stores a new immutable `company_snapshots` row.
8. App stores source child records tied to the snapshot.
9. App writes an `audit_events` row for refresh.

Failed sections should not corrupt existing data. A snapshot should capture fetch status and any missing sections so scoring can emit missing-data flags.

## 6. Snapshot Creation Flow

Snapshots are point-in-time evidence records. They should not be mutated after creation.

Flow:

- Start snapshot creation.
- Fetch Companies House sections.
- Persist raw profile JSON and derived summary fields.
- Persist filings, accounts metadata, charges, officers, and PSCs.
- Mark missing or failed sections in snapshot metadata.
- Write audit event.
- Return snapshot id for scoring.

## 7. Scoring Engine Architecture

Module: `src/lib/scoring/engine.ts`

Architecture:

- Pure deterministic function.
- Inputs: `CompanySnapshot`, `ManualAdverseEvent[]`, `ScoringModelVersion`.
- Output: `ScoreRunInputResult` shape containing score, band, confidence, recommended limit, reason codes, missing-data flags, and manual override state.
- Hard-stop handling before normal scoring.
- Factor groups implemented as small evaluators.
- Financial scoring intentionally skeletal in this slice; missing accounts produce missing-data flags and reason codes.

Factor groups:

- Company status.
- Company age.
- Filing behaviour.
- Financial strength.
- Charges.
- Manual CCJ/adverse events.
- Director/PSC signals v1.
- SIC/sector weighting.
- Data completeness.

## 8. Seed Data for Scoring Model v1

Seed a published model:

- Version: `1.0.0`.
- Status: `published`.
- Change note: `Initial MVP scoring model`.
- Band thresholds in JSON.
- Initial factor weights in JSON.
- Initial limit rules in JSON.

Published model versions are immutable. Future model changes require a new version.

## 9. Audit Event Strategy

`audit_events` is append-only.

P0 events:

- `company.search`
- `company.snapshot.created`
- `score.run.created`
- `manual_adverse_event.created`
- `manual_adverse_event.superseded`
- `decision.created`
- `report.exported`

Audit events must not store API keys, cookies, tokens, or raw secrets.

## 10. P0 Route Implementation Order

1. `/search`
2. `/companies/[companyNumber]`
3. `/companies/[companyNumber]/score`
4. `/companies/[companyNumber]/adverse`
5. `/companies/[companyNumber]/financials`
6. `/companies/[companyNumber]/people`
7. `/companies/[companyNumber]/report`

Admin scoring UI, watchlist UI, monitoring UI, and PDF export implementation are deferred until their planned slices.

## 11. Testing Strategy

P0 tests:

- Scoring band mapping.
- Hard-stop status behaviour.
- Reason-code output shape.
- Missing-data flag handling.
- Manual adverse event scoring influence.
- Companies House client environment validation.
- Companies House client request configuration using mocked fetch.
- Migration validation once `DATABASE_URL` is available.

Use live Companies House API only in explicit integration tests. Unit tests must not make live API calls.

## 12. Known Risks and Deferred Items

Known risks:

- Companies House payload shapes vary by endpoint and company type.
- Accounts extraction can be inconsistent across filing types.
- CCJ data is not complete from Companies House and must be labelled manual unless a licensed source is added.
- Scoring weights need business calibration before production use.
- Advisory-score compliance copy must remain visible in UI and reports.

Deferred:

- Full UI.
- PDF generation.
- Accounts extraction.
- Watchlist.
- Monitoring.
- Admin scoring UI.
- Email alerts.
- Internal payment behaviour integration.

