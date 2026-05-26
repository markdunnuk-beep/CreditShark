# CreditShark Scoring From Snapshot

## What Was Built

This slice adds deterministic scoring from the latest persisted Companies House snapshot.

Added:

- Snapshot-to-score mapper.
- Scoring persistence service.
- Immutable score-run persistence.
- Source-linked reason-code persistence.
- Credit recommendation persistence.
- `score.run.created` audit event.
- Company profile score summary.
- `/companies/[companyNumber]/score` explanation route.
- Optional live score-run smoke script.
- Unit tests for mapper behaviour.

No manual adverse-event UI, PDF export, auth, watchlist, admin scoring UI or XBRL/iXBRL accounts extraction was added.

## Scoring Flow

Opening:

```text
/companies/[companyNumber]
```

creates a fresh Companies House snapshot, then runs a score for the latest snapshot.

The scoring service:

1. Sanitises the company number.
2. Loads the durable company identity.
3. Loads the latest immutable snapshot.
4. Loads child evidence rows for accounts, charges, officers and PSCs.
5. Loads active manual adverse events, if any already exist.
6. Loads the latest published scoring model.
7. Maps persisted rows into the scoring engine input.
8. Runs the deterministic scoring engine.
9. Inserts an immutable `score_runs` row.
10. Inserts `score_reason_codes`.
11. Inserts a `credit_recommendations` row.
12. Inserts `score.run.created` into `audit_events`.

## Database Tables Used

- `companies`
- `company_snapshots`
- `company_accounts`
- `company_charges`
- `company_officers`
- `company_pscs`
- `manual_adverse_events`
- `scoring_model_versions`
- `score_runs`
- `score_reason_codes`
- `credit_recommendations`
- `audit_events`

No schema migration was required for this slice.

## Reason-Code Persistence

Reason codes are persisted exactly as emitted for the score run:

- `code`
- `label`
- `group`
- `direction`
- `weight`
- `impact`
- `source_type`
- `source_id`
- `source_date`
- `explanation`
- `sort_order`

Historical reason wording is not regenerated. The explanation route reads the persisted reason rows for the selected latest score run.

## Score Explanation Route

```text
/companies/[companyNumber]/score
```

loads the latest score run for the company and displays:

- advisory score
- risk band
- confidence
- recommended limit
- model version
- source timestamp
- score-run timestamp
- grouped factor breakdown
- full reason-code rows
- missing-data flags
- CreditShark advisory guardrails

If no score run exists, the route shows a clear empty state and links back to the company profile.

## Smoke Test

```powershell
npm run smoke:score-run -- 00445790
```

The script loads `.env.local`, creates a fresh snapshot, runs and persists a score, then prints a non-sensitive summary. It never prints `DATABASE_URL`, API keys or raw source JSON.

## Known Limitations

- The profile route creates a new snapshot and score run on every view during MVP.
- Manual adverse events are loaded if already present, but entry/edit UI is deferred.
- Structured financial metrics remain unavailable until accounts extraction is built.
- Companies House pagination is not fully traversed yet.
- Scoring calibration is deliberately simple and deterministic for v1.
- Recommendation output is advisory and is not a lending decision.
- Authenticated actor ids are not available yet, so audit events use anonymous/system context.

## Next Task Recommendation

Build manual adverse-event input:

1. Add `/companies/[companyNumber]/adverse`.
2. Allow authorised internal users to enter CCJ/adverse records manually.
3. Supersede, rather than delete, manual records.
4. Label manual data clearly in the UI.
5. Re-run scoring after manual adverse data changes.
