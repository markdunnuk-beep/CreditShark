# CreditShark Company Profile and Snapshots

## What Was Built

This slice replaces the placeholder company route with a server-rendered company profile first viewport backed by live Companies House data and immutable database snapshots.

Added:

- Server-only Postgres helper.
- Companies House normalisers.
- Company snapshot creation service.
- `/companies/[companyNumber]` profile route.
- Snapshot smoke-test script.
- Unit tests for validation and normalisation.

No scoring UI, score-run persistence, PDF export, auth, watchlist or admin scoring UI was added.

## Database Tables Used

- `companies`
- `company_snapshots`
- `company_filings`
- `company_charges`
- `company_officers`
- `company_pscs`
- `audit_events`

The existing schema already supports immutable snapshots and `missing_sections_json`, so no additional migration was required.

## Route Behaviour

Opening:

```text
/companies/[companyNumber]
```

does the following at runtime:

1. Sanitises the route company number.
2. Fetches Companies House source sections server-side.
3. Upserts durable company identity.
4. Creates a fresh immutable snapshot.
5. Persists source child records where available.
6. Inserts `company.snapshot.created` audit event.
7. Renders the first company profile viewport.

Each page refresh creates a new point-in-time snapshot during MVP.

## Snapshot Creation Flow

Required source section:

- Company profile.

Best-effort source sections:

- Filing history.
- Charges.
- Officers.
- Persons with significant control.

If the profile fetch fails, no snapshot is created. If a best-effort section fails, the service creates a partial snapshot and records the section name in `missing_sections_json`.

## Companies House Sections Fetched

- `GET /company/{companyNumber}`
- `GET /company/{companyNumber}/filing-history`
- `GET /company/{companyNumber}/charges`
- `GET /company/{companyNumber}/officers`
- `GET /company/{companyNumber}/persons-with-significant-control`

Raw source payloads are stored in database `jsonb` columns where supported, but raw JSON is not displayed in the UI.

## Audit Event Behaviour

The service inserts:

```text
company.snapshot.created
```

Without auth, `actor_type` is `anonymous_user` and `actor_id` is null.

Metadata includes:

- Company number.
- Snapshot id.
- Source.
- Fetched sections.
- Failed sections.
- Creation route/script source.

Secrets are not stored in audit metadata.

## Known Limitations

- No stale-snapshot reuse yet.
- No pagination across large Companies House sections yet.
- No accounts extraction yet.
- No scoring on the profile page yet.
- No authenticated actor id yet.
- No RLS-specific app user strategy yet; server-side access currently uses `DATABASE_URL`.
- Result counts reflect the fetched page of source data, not guaranteed all historical records where Companies House pagination applies.

## Smoke Test

```powershell
npm run smoke:company-snapshot -- 00445790
```

The script loads `.env.local`, creates a snapshot and prints a non-sensitive summary. It never prints `DATABASE_URL` or API keys.

## Next Task Recommendation

Build the scoring UI slice:

1. Load the latest snapshot or just-created snapshot.
2. Load published scoring model `1.0.0`.
3. Run the deterministic scoring engine.
4. Persist `score_runs` and `score_reason_codes`.
5. Render `/companies/[companyNumber]/score` and show score explanation from source-linked reason codes.

