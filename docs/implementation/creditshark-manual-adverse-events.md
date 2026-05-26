# CreditShark Manual Adverse Events

## What Was Built

This slice adds manual adverse event and CCJ-style record entry for companies that already have a durable CreditShark company record.

Added:

- Manual adverse event service.
- Manual adverse event validation.
- `/companies/[companyNumber]/adverse` route.
- Server-side form actions for create, supersede, deactivate and re-score.
- Profile link/card for manual adverse events.
- Score explanation warning when manual data influenced the score.
- Smoke script for a harmless test manual note.
- Unit tests for manual-event validation.

No auth, external CCJ registry integration, PDF export, watchlist, admin scoring UI or accounts extraction was added.

## Route Behaviour

```text
/companies/[companyNumber]/adverse
```

loads the durable company record and displays:

- Companies House charges summary from the latest snapshot.
- Active manual adverse events.
- Superseded or inactive manual event history.
- Add manual adverse event form.
- Re-run advisory score action.

If the company record does not exist, the page asks the user to open the company profile first. This avoids creating manual data against an unknown company identity.

## Manual Event Fields

- `event_type`
- `event_date`
- `amount`
- `currency`
- `status`
- `source_note`
- `evidence_reference`
- `is_active`

Supported MVP event types:

- `ccj`
- `payment_default`
- `insolvency_note`
- `adverse_note`
- `other`

Supported MVP statuses:

- `unsatisfied`
- `satisfied`
- `disputed`
- `paid`
- `unknown`
- `note_only`

## Validation Rules

- Event type is required and must be supported.
- Status is required and must be supported.
- Event date is required for `ccj` and `payment_default`.
- Amount is optional, but must be numeric and non-negative when provided.
- Currency defaults to `GBP`.
- Source note is required and must explain where the manual information came from.
- Blank manual entries are rejected.

## Supersede And Deactivate Behaviour

Manual events are never silently deleted.

When an active event is replaced, CreditShark:

1. Inserts a new manual adverse event.
2. Marks the previous event inactive.
3. Links the previous event to the replacement with `superseded_by_id`.
4. Writes `manual_adverse_event.superseded` to the audit log.

When an event is deactivated, CreditShark:

1. Marks `is_active` false.
2. Stores update metadata.
3. Writes `manual_adverse_event.deactivated` to the audit log with the deactivation reason.

## Audit Events

The service writes:

- `manual_adverse_event.created`
- `manual_adverse_event.superseded`
- `manual_adverse_event.deactivated`

Audit metadata includes company number, manual event id, event type/status where relevant, replacement id where relevant and route/script source. No secrets are stored.

## Scoring Integration

The existing scoring service already loads active, non-superseded manual adverse events. Active manual events:

- affect the next score run,
- set `manualOverrideState` to `manual_data_present`,
- emit a manual adverse reason code,
- appear on the score explanation page after re-scoring.

Inactive or superseded events are excluded from new score runs.

## Smoke Test

```powershell
npm run smoke:manual-adverse -- 00445790
```

The script:

1. Ensures the company exists, creating a snapshot only if needed.
2. Inserts a harmless `adverse_note` with source note clearly labelled as smoke-test data.
3. Re-runs scoring.
4. Prints a non-sensitive score summary and manual reason-code count.
5. Deactivates the test manual event as cleanup.

The smoke script does not create a false CCJ claim.

## Known Limitations

- There is no auth yet, so actor ids are anonymous/system-level.
- Manual events are user-entered only and are not verified registry data.
- There is no external CCJ API integration yet.
- The form uses full-page server actions rather than client-side enhancement.
- There is no PDF/report rendering of manual events yet.
- Re-scoring uses the latest persisted snapshot and does not fetch fresh Companies House data.

## Next Task Recommendation

Build the PDF/report export slice:

1. Report cover and advisory disclaimer.
2. Company identity and source timestamps.
3. Advisory score and reason codes.
4. Manual adverse event section with clear manual-data labelling.
5. Companies House filings/charges evidence summary.
6. `report_exports` audit persistence.
