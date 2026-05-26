# CreditShark MVP Page Map

## Navigation Model

CreditShark should use a focused navigation model for credit screening:

- Search.
- Watchlist.
- Admin scoring.
- Account/admin utilities as needed.

Company-specific pages should share a consistent company header with:

- Company name.
- Company number.
- Status.
- Latest snapshot timestamp.
- Current score/band if available.
- Actions: refresh, run score, record decision, export report, watch/unwatch.

Avoid copying any external platform layout. Use a simple CreditShark structure optimised for fast B2B trade-risk review.

## `/search`

Purpose: Find a UK limited company and start a screening workflow.

Primary users: finance, credit control, sales operations, approvers.

Core UI:

- Search input for company number or name.
- Optional filters: active/dissolved/all, postcode, SIC.
- Loading state while Companies House search runs.
- Result list with disambiguation fields.
- Empty state for no match.

Result fields:

- Company name.
- Company number.
- Status.
- Registered office locality/postcode where available.
- Incorporation date.
- Latest accounts date where available.
- SIC summary where available.
- Exact number match indicator.

Primary actions:

- Open company.
- Create or refresh snapshot.

## `/companies/[companyNumber]`

Purpose: Main company profile and decision summary.

First viewport:

- Company identity and status.
- Risk score, risk band, confidence, and recommended credit limit.
- Top positive reasons.
- Top negative reasons.
- Missing-data warnings.
- Manual-data warnings.
- Latest source refresh timestamp.

Main sections:

- Company identity.
- Current recommendation.
- Key filing/account signals.
- Key adverse/legal signals.
- Key people/PSC signals.
- Recent score runs.
- Recent decisions.
- Audit events summary.

Primary actions:

- Refresh Companies House data.
- Run score.
- Add manual adverse event.
- Record decision.
- Export PDF report.
- Add/remove from watchlist.

## `/companies/[companyNumber]/score`

Purpose: Explain the score and recommendation.

Core UI:

- Score, band, confidence, model version, run timestamp.
- Recommended limit and basis of calculation.
- Factor-group breakdown.
- Reason code table.
- Missing-data flags.
- Manual override state.
- Input snapshot reference.

Reason-code fields:

- Code.
- Label.
- Group.
- Direction.
- Weight.
- Impact.
- Source type.
- Source date.
- Explanation.

Primary actions:

- Re-run score.
- View source evidence.
- Record decision.

## `/companies/[companyNumber]/financials`

Purpose: Review Companies House filings and available accounts evidence.

Core UI:

- Latest accounts status.
- Confirmation statement status.
- Filing timeline.
- Accounts type.
- Accounts due dates and overdue flags.
- Extracted financial metrics where available.
- 3-5 year trend summary where available.
- Source filing links.
- Missing-data explanation for micro-entity, dormant, abridged, or unavailable accounts.

Primary actions:

- Refresh filings.
- View source filing.
- Export report.

## `/companies/[companyNumber]/adverse`

Purpose: Review charges and manual adverse events.

Core UI:

- Active charges count.
- Satisfied charges count.
- Charges table.
- Manual CCJ/adverse events table.
- Event timeline.
- Clear source labels: Companies House, manual, internal.
- Manual-data warning where manual events affect score.

Manual adverse fields:

- Event type.
- Event date.
- Amount.
- Status.
- Source note.
- Evidence reference.
- Entered by.
- Entered at.
- Updated by/at.

Primary actions:

- Add manual adverse event.
- Edit/supersede manual event.
- Re-run score.

## `/companies/[companyNumber]/people`

Purpose: Review current officers and PSC evidence.

Core UI:

- Current officers.
- Former officers summary.
- PSC list.
- Appointment and resignation dates.
- Officer count and churn indicators.
- Basic v1 risk flags only.

Primary actions:

- Refresh people data.
- View source record.

V1 constraint: do not infer personal creditworthiness. Officer/PSC signals should be light-touch company-risk context only.

## `/companies/[companyNumber]/report`

Purpose: Preview and export the CreditShark report.

Core UI:

- Report preview.
- Included sections.
- Score and recommendation summary.
- Evidence timestamps.
- Manual-data labels.
- Data limitations.
- Decision record if selected.

Primary actions:

- Export PDF.
- Record export audit event.

Report sections:

- Cover summary.
- Decision rationale.
- Company identity.
- Filing and accounts.
- Charges and adverse events.
- Directors and PSC.
- Decision record.
- Audit trail summary.
- Limitations.

## `/watchlist`

Purpose: Track companies selected for ongoing review.

Core UI:

- Watched companies.
- Current score/band.
- Last refreshed.
- Last decision.
- Recent monitoring events.
- Upcoming filing deadlines.
- Material change flags.

Primary actions:

- Open company.
- Remove from watchlist.
- Refresh selected company.
- Export CSV.

## `/admin/scoring`

Purpose: Manage scoring model configuration and version history.

Core UI:

- Published model version.
- Draft model version.
- Band thresholds.
- Factor weights.
- SIC/sector weights.
- Recommended-limit rules.
- Preview against sample companies.
- Change history.

Primary actions:

- Create draft model version.
- Edit weights.
- Preview impact.
- Publish model version.

Access: admin users only.

