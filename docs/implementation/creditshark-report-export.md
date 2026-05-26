# CreditShark Report Export

## What Was Built

This slice adds a print-optimised advisory trade-risk report preview and explicit report export audit recording.

Added:

- Report data service.
- Report export persistence.
- `report.exported` audit event.
- `/companies/[companyNumber]/report` preview route.
- Print/save-as-PDF browser action.
- Profile and score-page report links.
- Report export smoke script.
- Unit tests for report sections, reason summaries and audit metadata.

No server-side PDF library, stored binary file, email sending, auth, watchlist, custom templates or external CCJ integration was added.

## Report Generation Approach

The MVP uses an HTML report preview with print-friendly CSS. Users can use the browser print dialog to save the report as PDF.

This avoids adding heavy PDF infrastructure or browser automation that could make Vercel deployment brittle. The export event is still persisted and audit logged before printing.

## Report Route Behaviour

```text
/companies/[companyNumber]/report
```

loads the latest persisted company report context:

- durable company identity
- latest snapshot linked to the latest score run
- latest score run
- persisted reason codes
- credit recommendation
- filing rows
- charges
- officer/PSC summary
- active manual adverse events
- inactive/superseded manual event count
- model version and timestamps

The route does not create a new Companies House snapshot and does not create a new score run.

If company, snapshot or score data is missing, the page shows a clear empty state telling the user to open the profile and run an advisory score first.

## Report Sections

The report preview includes:

- Cover summary.
- Recommendation summary.
- Company identity.
- Filing and accounts evidence.
- Charges and adverse events.
- Directors and PSC summary.
- Reason-code detail.
- Audit and limitations.

The report preserves:

- snapshot id
- score run id
- model version
- generated timestamp
- source timestamp
- score run timestamp
- missing data flags
- manual data labels
- advisory disclaimer

## Report Export Persistence

The explicit action:

```text
Record export and print report
```

inserts into `report_exports`:

- `company_id`
- `snapshot_id`
- `score_run_id`
- `decision_record_id`: null
- `report_type`: `trade_risk_report`
- `file_path`: null
- `file_hash`: deterministic hash of report context
- `exported_by`: `anonymous_user` until auth exists
- `included_sections_json`

No binary PDF file is stored in this slice. The table records the generated report event and report context.

## Audit Event Behaviour

The export action writes:

```text
report.exported
```

Audit metadata includes:

- company number
- report export id
- snapshot id
- score run id
- report type
- included sections
- source route/action

Secrets, API keys, raw JSON and database URLs are not stored.

## Print / Save PDF Usage

1. Open `/companies/[companyNumber]/report`.
2. Review the report preview.
3. Click `Record export and print report`.
4. The export record is persisted and the page redirects with the export id.
5. Click `Print / save as PDF`.
6. Use the browser print dialog to save as PDF.

Print CSS hides app navigation, footer and interactive controls.

## Smoke Test

```powershell
npm run smoke:report-export -- 00445790
```

The script requires an existing company and score run. It creates a report export record and prints only:

- company number
- report export id
- snapshot id
- score run id
- report type
- included section count

It does not print raw JSON, manual source notes, API keys or database URLs.

## Known Limitations

- No stored PDF binary yet.
- No custom report templates yet.
- No auth-based `exported_by` yet.
- The report uses the latest score run, so visiting the profile afterwards may create a newer score run.
- Structured financial extraction remains unavailable until the accounts extraction slice.
- Manual adverse data is user-entered and not verified registry data.

## Next Task Recommendation

Build the decision-record workflow:

1. Record approve/refer/reject decisions as user decisions, not automated outcomes.
2. Link decisions to score runs and report exports.
3. Add reviewer notes and override reasons.
4. Preserve audit trail and advisory guardrails.
