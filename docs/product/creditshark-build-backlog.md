# CreditShark Build Backlog

## P0 - MVP Foundation

### 1. App Setup

- Scaffold the web app.
- Add auth/user identity placeholder appropriate for internal use.
- Add environment configuration.
- Add base layout, navigation, and error boundaries.
- Add product guardrail copy for advisory limited-company screening.

Acceptance:

- App runs locally.
- `/search` is reachable.
- Product does not describe itself as consumer credit, lending, broking, debt advice, or regulated rating.

### 2. Database Schema

- Create all P0 tables: companies, snapshots, filings, accounts, charges, officers, PSCs, manual adverse events, score runs, reason codes, recommendations, decisions, report exports, audit events, model versions.
- Add indexes on company number, snapshot, score run, and audit entity.
- Add migration and seed for scoring model v1.

Acceptance:

- Schema can be migrated from empty database.
- Published model version exists.

### 3. Companies House API Client

- Implement company search.
- Implement company profile lookup.
- Implement filing history lookup.
- Implement charges lookup.
- Implement officers lookup.
- Implement PSC lookup.
- Add retries, rate-limit handling, and source timestamp capture.

Acceptance:

- API client returns typed results.
- Failures are captured without corrupting snapshots.

### 4. Company Search

- Build `/search`.
- Search by company number and name.
- Display disambiguation fields.
- Add loading, no-result, and API-error states.
- Audit searches.

Acceptance:

- User can find and open a company.
- Exact company-number matches are prioritised.

### 5. Company Profile Snapshot

- Create or refresh a company snapshot from Companies House data.
- Persist profile, filings, charges, officers, and PSCs.
- Compute basic derived fields.
- Show snapshot timestamp.

Acceptance:

- Opening a company creates or loads a snapshot.
- Refresh creates a new snapshot.

### 6. Scoring Engine

- Implement deterministic score engine.
- Load published model version.
- Produce score, band, confidence, recommended limit, missing-data flags, and manual override state.
- Store immutable score run.

Acceptance:

- Score run can be created from a snapshot.
- Historical score runs remain unchanged after a new run.

### 7. Score Explanation

- Build `/companies/[companyNumber]/score`.
- Display factor-group breakdown.
- Display reason-code table.
- Show source type/date and explanations.
- Show missing-data flags and limitations.

Acceptance:

- Every score output has visible reason codes.
- User can identify why the recommendation changed.

### 8. Filing Behaviour

- Derive accounts and confirmation-statement status.
- Detect overdue flags where possible.
- Surface filing status on company profile and financials page.
- Add filing reason codes.

Acceptance:

- Current/overdue filing state affects score and explanation.

### 9. Charges

- Store active and satisfied charges.
- Build charges section on `/companies/[companyNumber]/adverse`.
- Add charge count and recency reason codes.

Acceptance:

- Active charges are visible and can affect score.

### 10. Manual Adverse Events

- Add manual event form.
- Support CCJ and other adverse event types.
- Require source note and user attribution.
- Supersede rather than silently delete events.
- Include manual events in scoring.

Acceptance:

- Manual adverse events are visibly labelled and audit logged.
- Re-running score reflects active manual events.

### 11. PDF Report

- Build `/companies/[companyNumber]/report`.
- Generate PDF with summary, score, limit, reason codes, evidence, timestamps, manual data labels, decision, and limitations.
- Store report export record.

Acceptance:

- Exported report references exact snapshot and score run.

### 12. Audit Trail

- Implement append-only audit events.
- Log search, snapshot refresh, score run, manual event, decision, watchlist change, and report export.
- Show recent audit events on company profile.

Acceptance:

- Material actions can be reconstructed from audit events.

## P1 - Strong Internal Product

### 1. Watchlist

- Add/remove company from watchlist.
- Build `/watchlist`.
- Show watched companies, current band, last refresh, and recent changes.

### 2. Monitoring Events

- Compare snapshots for watched companies.
- Detect status, filing, charge, officer/PSC, and manual adverse changes.
- Allow acknowledgement.

### 3. Decision Workflow

- Add approve/refer/reject decision form.
- Capture requested limit, recommended limit, approved limit, reviewer notes, and override reason.
- Show decision history.

### 4. Accounts Extraction

- Extract key metrics where available.
- Label extraction method and missing fields.
- Add financial-strength reason codes.

### 5. SIC Weighting

- Add configurable SIC weights.
- Show sector adjustment as low-impact reason code.
- Include SIC rationale in admin data.

### 6. Portfolio Dashboard

- Add watchlist-level risk distribution.
- Show upcoming filing deadlines.
- Show recent monitoring events.

### 7. CSV Export

- Export search results.
- Export watchlist.
- Export portfolio risk summary.
- Audit CSV exports.

## P2 - Later Enhancements

### 1. Director Risk v1

- Add officer churn indicators.
- Add multiple-current-appointment indicators if sourced.
- Keep weighting low and explanations conservative.

### 2. Group/Relationship View

- Add simple relationship list if data source supports it.
- Defer graph UI until a clear user workflow requires it.

### 3. Scoring Config UI

- Build `/admin/scoring`.
- Edit draft model weights.
- Preview impact on sample companies.
- Publish immutable model versions.

### 4. Email Alerts

- Send monitoring digest.
- Send material change alert.
- Store delivery audit events.

### 5. Internal Payment Behaviour Integration

- Integrate only trusted internal ledger/payment data.
- Do not infer payment behaviour from Companies House data.
- Clearly label internal payment data source and timestamp.

### 6. Export Templates

- Add short internal report.
- Add full evidence report.
- Add approver summary.

## Explicit Deferrals

- Consumer credit checks.
- Sole trader credit reports.
- AML/KYC screening.
- Debt advice.
- Credit broking.
- Lending workflow.
- Debt collection.
- Unlicensed trade-payment data.
- International score.
- Complex group graph in MVP.

