# CreditShark Decision Record Workflow

## What Was Built

This slice adds a user-recorded commercial decision workflow for companies that already have a persisted advisory score run.

Added:

- Server-side decision service.
- `/companies/[companyNumber]/decision` route.
- Decision form and history view.
- Profile and score-page links/summary blocks.
- Latest decision context in the report preview and report export link when the decision belongs to the latest score run.
- `decision.created` audit event.
- Decision smoke script.
- Unit tests for validation, audit metadata and limit formatting.

No auth, approval chain, watchlist, notifications, lending workflow, credit broking workflow, external CCJ integration or automated approve/decline logic was added.

## Decision Values and Meaning

Product-facing values:

- `approve_within_recommended_limit`: the user records an approval outcome, normally within the advisory recommended limit.
- `refer_for_review`: the user records that the case should move to manual/commercial review.
- `decline_or_prepayment_only`: the user records a commercial outcome where open credit is not extended.

The existing database check constraint stores these as:

- `approve`
- `refer`
- `reject`

The UI and audit metadata use the product-facing language.

## Validation Rules

The decision service validates:

- decision is required and must be supported;
- currency defaults to `GBP` and must be a three-letter code;
- requested limit is optional but must be non-negative if provided;
- final approved limit is required for approval and must be non-negative;
- reviewer notes are required for all decisions;
- override reason is required when an approval goes outside the advisory recommendation.

Override reason is required when:

- approved limit exceeds the recommended limit;
- high, very-high or not-scored risk is approved for a non-zero limit;
- no recommendation exists and a non-zero limit is approved.

## Database Tables Used

- `companies`
- `score_runs`
- `credit_recommendations`
- `company_snapshots`
- `decision_records`
- `audit_events`
- `report_exports`

No database schema migration was added.

## Audit Event Behaviour

Creating a decision inserts:

```text
decision.created
```

Audit metadata includes:

- company number;
- decision record id;
- score run id;
- credit recommendation id if available;
- decision;
- requested limit;
- approved limit;
- currency;
- override present true/false;
- source route/action.

Full reviewer notes are stored only in `decision_records`, not audit metadata.

## Report Integration

The report preview shows the latest recorded commercial decision, including requested limit, recommended limit, final approved limit, reviewer-note summary, override reason and decided timestamp.

When recording a report export, `decision_record_id` is linked only if the latest decision belongs to the same latest score run used by the report. Otherwise the report view still displays the latest decision, but the export record is not linked to avoid implying it used a different score run.

## Smoke Test Usage

```powershell
npm run smoke:decision-record -- 00445790
```

The smoke script:

1. loads `.env.local`;
2. reuses an existing company score run or creates snapshot/score first;
3. records a harmless `refer_for_review` decision;
4. prints a non-sensitive summary.

Decision records are immutable. The smoke script does not silently delete records.

## Known Limitations

- There is no authenticated user identity yet, so records use `anonymous_user`.
- Decision correction is not implemented; a later correction should create a new decision record.
- Existing database enum/check language remains `approve`, `refer`, `reject`; UI maps this to the preferred product wording.
- Report export links the latest decision only when it matches the latest score run.
- No approval workflow, watchlist, or external adverse-data integration is included.

## Next Task Recommendation

Add authenticated internal users so decision records, manual adverse events, score runs and exports can capture real actor ids instead of anonymous/system context.
