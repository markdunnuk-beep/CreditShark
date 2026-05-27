# CreditShark Company Workspace Tabs

Implementation date: 27 May 2026

## What Was Built

Task 12C makes company-specific routes feel like one coherent company workspace while preserving the existing deep-linkable URLs.

Company routes now render inside a shared workspace header and tab model:

- `/companies/[companyNumber]`
- `/companies/[companyNumber]/score`
- `/companies/[companyNumber]/adverse`
- `/companies/[companyNumber]/history`
- `/companies/[companyNumber]/report`
- `/companies/[companyNumber]/decision`

The broader platform shell remains available around the company workspace, with routes back to Dashboard, Company Search and Watchlist.

## Workspace Shell Approach

The shared route wrapper is implemented with:

- `app/companies/[companyNumber]/layout.tsx`
- `app/components/company-workspace-shell.tsx`
- `app/components/company-workspace-tabs.tsx`
- `src/lib/company-workspace/company-workspace-service.ts`
- `src/lib/company-workspace/company-workspace-tabs.ts`

The workspace layout is read-only. It loads existing persisted company, snapshot, score, manual-data and watchlist context for the header. It does not create a new Companies House snapshot and does not create a new score run.

The Summary route still owns the existing live-check behaviour. Opening `/companies/[companyNumber]` continues to create a fresh Companies House snapshot and run advisory scoring as before.

## Tab Model

Current tabs:

| Tab | Route |
|---|---|
| Summary | `/companies/[companyNumber]` |
| Score & Reasons | `/companies/[companyNumber]/score` |
| Adverse Events | `/companies/[companyNumber]/adverse` |
| Score History | `/companies/[companyNumber]/history` |
| Reports & Decisions | `/companies/[companyNumber]/report` |

The `/companies/[companyNumber]/decision` route is also mapped to the Reports & Decisions active tab.

Future tabs are intentionally omitted until implemented:

- Financials & Filings
- People & Control

## Route Mapping

| Existing route | Workspace treatment |
|---|---|
| `/companies/[companyNumber]` | Summary tab. Keeps live snapshot and score-run behaviour. |
| `/companies/[companyNumber]/score` | Score & Reasons tab. Reads the latest persisted score run. |
| `/companies/[companyNumber]/adverse` | Adverse Events tab. Keeps manual adverse event workflow. |
| `/companies/[companyNumber]/history` | Score History tab. Shows previous checks as history. |
| `/companies/[companyNumber]/report` | Reports & Decisions tab. Keeps report preview/export behaviour. |
| `/companies/[companyNumber]/decision` | Reports & Decisions tab. Keeps decision-record workflow. |

## Header Data Approach

The shared company header shows:

- Company name
- Company number
- Company status
- Latest CreditShark check timestamp where available
- Companies House evidence timestamp where available
- Advisory score
- Risk band
- Recommended limit
- Confidence
- Manual-data indicator
- Watchlist state

Header actions:

- Record decision
- View report
- Add manual data
- Add/remove watchlist
- Watchlist
- View score history

Because the header is read-only and the Summary route creates a fresh check after the layout has already loaded, the header may briefly reflect the latest persisted check from before the Summary page creates the newest score run. The Summary tab itself remains the source of the just-created current check.

## Reports & Decisions Handling

Reports and decisions remain separate routes for now:

- `/report` handles report preview and export recording.
- `/decision` handles user-recorded commercial decisions.

Both routes present the Reports & Decisions tab as active. The routes are not merged in this task.

Report-only limitations remain inside the report document because reports may be printed, saved or shared outside the app.

## Mobile Behaviour

The company workspace uses responsive layout rules:

- The platform sidebar stacks above content on smaller screens.
- Company header actions stack on mobile.
- Company metrics collapse from four columns to two on tablet and one on narrow mobile.
- Workspace tabs are horizontally scrollable.
- Report and decision routes remain deep-linkable and usable at narrow widths.

## What Was Deliberately Not Changed

- Scoring logic.
- Score weights.
- Snapshot creation behaviour.
- Companies House API behaviour.
- Database schema.
- Report export persistence.
- Manual adverse persistence.
- Decision persistence.
- Watchlist persistence.
- Vercel settings.
- Authentication or user roles.
- External CCJ integration.
- Accounts/XBRL extraction.
- Heavy charting libraries.

## Known Limitations

- The company header is based on latest persisted data and does not force a fresh check.
- The Summary route still performs the live check and score run, so the header can lag the just-created Summary result until the next navigation.
- The Reports & Decisions tab has two routes rather than an in-tab switch component.
- Future Financials & Filings and People & Control tabs are omitted until real content exists.

## Validation Performed

Required validation:

- `npm run lint`
- `npm run test`
- `npm run build`
- `git status --short`

Browser checks should cover:

- `/companies/00445790`
- `/companies/00445790/score`
- `/companies/00445790/adverse`
- `/companies/00445790/history`
- `/companies/00445790/report`
- `/companies/00445790/decision`

At desktop, tablet and mobile widths.

Smoke checks are recommended because the company route rendering changed materially:

- `npm run smoke:companies-house -- 00445790`
- `npm run smoke:company-snapshot -- 00445790`
- `npm run smoke:score-run -- 00445790`

## Next Task Recommendation

Recommended next task: **Task 12D - company workspace content hierarchy refinement**.

Reason: the route-level workspace and tabs are now in place, so the next pass can reduce duplicated in-tab action blocks and improve Summary, Score and Reports & Decisions content hierarchy without changing core product logic.
