# CreditShark Snapshot Error Resilience

## Production Issue Observed

Production route:

```text
/companies/06895946
```

rendered the CreditShark error state:

```text
Snapshot could not be created
06895946
Company snapshot could not be saved. Check server database configuration and permissions.
```

The route reached the application and rendered the company profile error state, so the likely failure class is runtime snapshot persistence or production environment configuration rather than Vercel routing/build.

## Reproduction Results

Local smoke tests on 2026-05-27:

| Command | Result |
| --- | --- |
| `npm run smoke:companies-house -- 06895946` | Pass. Returned NORTH WEST LOGISTICS LTD. |
| `npm run smoke:company-snapshot -- 06895946` | Pass. Snapshot created with 25 filings, 13 charges, 5 officers, 2 PSCs, no missing sections. |
| `npm run smoke:score-run -- 06895946` | Pass. Score run created, score 56, moderate risk, low confidence. |
| `npm run smoke:company-snapshot -- 00445790` | Pass. Snapshot created with 25 filings, 9 charges, 35 officers, 0 PSCs, no missing sections. |
| `npm run smoke:score-run -- 00445790` | Pass. Score run created, score 62, low risk, low confidence. |

Conclusion: the observed issue is not reproducible locally with the current `.env.local` and appears production-only or production-environment-sensitive.

## Suspected Cause

The code previously collapsed all required and optional database writes into one transaction and returned one generic `database_error`. Any failure in child sections or audit insertion would roll back the whole snapshot and hide the failing stage.

Because the local path now succeeds for both the failing production company and the known-good comparison company, likely production causes include:

- production `DATABASE_URL` missing, malformed, or not suitable for serverless connection behaviour;
- production database role lacking insert permission on one required table;
- production schema drift from the local migration set;
- a production-only timeout or connection pooler issue;
- a child section or audit insert failing in production and previously rolling back the parent snapshot.

## Code Changes Made

- Added a structured snapshot stage model.
- Added safe reference codes for snapshot errors.
- Added safe server-side diagnostics containing company number, stage, reference code, error code/name, table, constraint, and upstream status when available.
- Kept secrets, raw payloads, API keys, database URLs, cookies and full Companies House JSON out of logs and smoke output.
- Isolated optional child-section inserts with transaction savepoints.
- Made audit insertion best-effort so a successful snapshot is not destroyed by an audit-table issue.
- Hardened Companies House normalisers for scalar/null/date safety.
- Added a batch smoke script for multiple company snapshot checks.
- Updated the profile route error state to show stage, reference code, retry and search actions.

## Error-Stage Model

Stages emitted by the snapshot service:

- `validate_company_number`
- `fetch_profile`
- `fetch_filings`
- `fetch_charges`
- `fetch_officers`
- `fetch_pscs`
- `upsert_company`
- `insert_snapshot`
- `insert_filings`
- `insert_charges`
- `insert_officers`
- `insert_pscs`
- `insert_audit_event`
- `run_score_after_snapshot`

The profile route only creates the snapshot. `run_score_after_snapshot` is reserved for callers that surface snapshot-and-score workflows.

## Optional Section Failure Handling

Required operations:

- company-number validation
- Companies House profile fetch
- company upsert
- snapshot insert

Optional operations:

- filings fetch/insert
- charges fetch/insert
- officers fetch/insert
- PSC fetch/insert
- audit event insert

Optional fetch failures are recorded in `missing_sections_json` before the snapshot row is inserted. Optional child insert failures are now isolated with savepoints, logged safely, and returned in the in-memory `missingSections` summary for the route response.

Current limitation: `company_snapshots` is protected by an update/delete trigger, so child insert failures discovered after snapshot insertion cannot be written back into the snapshot row without a deliberate schema migration that allows constrained metadata updates. The service does not weaken that immutability trigger in this change.

## Vercel and Supabase Environment Notes

Local smoke tests prove that the Companies House API key and local `DATABASE_URL` path work for both target companies.

For production, verify without exposing values:

- Vercel Production has `DATABASE_URL` set.
- Vercel Production has `COMPANIES_HOUSE_API_KEY` set.
- The Supabase connection string used by Vercel is suitable for serverless use, preferably the transaction pooler if direct connections are unreliable.
- The production database has the current schema and required tables.
- The production database role behind `DATABASE_URL` can insert into `companies`, `company_snapshots`, child source tables, score tables and `audit_events`.
- RLS, if later enabled, does not block the server-side database role used by this app.

## Remaining Limitations

- The MVP still creates a fresh snapshot and score run on each profile view.
- Companies House pagination is still limited to the fetched page.
- Child insert failures after snapshot insertion are logged and returned but not persisted into `company_snapshots.missing_sections_json` because of the current immutability trigger.
- Production root cause still needs confirmation from Vercel runtime logs using the new stage/reference diagnostics.

## Next Recommended Task

Deploy this resilience patch, reproduce `/companies/06895946` in production, then inspect Vercel runtime logs for the emitted `[creditshark.snapshot]` entry and reference code. If the stage points to connection or permission failure, fix the production Supabase/Vercel environment before adding new product features.
