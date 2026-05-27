# CreditShark Company Workspace Content Refinement

Implementation date: 27 May 2026

## What Was Changed

Task 12D refines the content hierarchy inside the existing company workspace tabs. The shared company header and tab model remain the orientation layer, while each tab now focuses on its specific job.

Routes refined:

- `/companies/[companyNumber]`
- `/companies/[companyNumber]/score`
- `/companies/[companyNumber]/adverse`
- `/companies/[companyNumber]/history`
- `/companies/[companyNumber]/report`
- `/companies/[companyNumber]/decision`

No route URLs, database schema, persistence behaviour, scoring logic, Companies House behaviour or Vercel settings were changed.

## Duplication Removed

The refinement reduces:

- Repeated score/risk/limit cards inside tabs where the workspace header already carries current score context.
- Repeated action stacks pointing to the same company routes.
- Repeated explanatory copy about advisory support, manual data and history.
- Primary-content exposure of raw snapshot and score IDs.
- Repeated company identity headings inside tab content.

Audit metadata remains available in secondary or collapsed areas where useful.

## Summary Tab Hierarchy

The Summary tab is now the current-risk view.

It is structured as:

1. Current risk summary with latest check timestamp, concise score reinforcement, top positive drivers and review factors.
2. Next best actions in one compact action group.
3. Key evidence snapshot with filings, charges, officers, PSC records and manual-event count.
4. Trade context for watchlist, latest decision and score-history movement.
5. Collapsed audit details for snapshot id, score run id, model version and source status.

The separate watchlist, manual data, report, score history and decision cards were consolidated to reduce page length and repeated actions.

## Score And Reasons Tab Hierarchy

The Score & Reasons tab now leads with source-linked score evidence rather than another full score card.

It is structured as:

1. Score evidence intro with score-run timestamp and score-history link.
2. Top score drivers grouped into positive drivers, review factors and missing/limited data.
3. Full reason-code detail with source chips, source dates, weights, impact and explanations.
4. Missing-data context and collapsed audit details.

Manual-data copy is kept short and contextual.

## Adverse Events Tab Hierarchy

The Adverse Events tab now reads as one evidence/action tab.

It is structured as:

1. Adverse overview separating Companies House charges from manual records.
2. Companies House charges summary.
3. Manual records summary with a secondary re-run advisory score action.
4. Active manual adverse records.
5. Collapsed add-manual-record form.
6. Collapsed inactive/superseded history.

Manual entries remain clearly labelled as user-entered records and distinct from Companies House evidence.

## Score History Tab Hierarchy

The Score History tab now presents movement first.

It is structured as:

1. Movement summary showing latest score, previous score, recommended limit and confidence.
2. Lightweight trend visual where enough rows exist.
3. Historical score-run table with decision/report links.

Future-monitoring explanation was removed from this tab to avoid over-explaining planned functionality.

## Reports And Decisions Handling

The report and decision routes remain separate URLs but now share a small local switch:

- Report preview
- Record decision

Report page:

- Keeps report document structure.
- Keeps standalone report limitations inside the report document.
- Reduces screen-level explanation outside the report.
- Keeps export and print controls clear.

Decision page:

- Keeps the decision form and decision history.
- Keeps `User-recorded decision` labelling.
- Makes recommendation context concise.
- Moves score run and snapshot IDs into collapsed audit details.
- Keeps override guidance in the form where it is needed.

## Shared CSS Refinement

Small utility styles were added in `app/globals.css`:

- `tab-section`
- `tab-intro`
- `secondary-audit-details`
- `compact-action-group`
- `evidence-summary-grid`
- `in-tab-switch`
- `collapsed-history`
- `reason-group-compact`
- `history-movement-grid`

No design-system refactor or external component library was introduced.

## What Was Deliberately Not Changed

- Scoring logic or score weights.
- Snapshot creation behaviour.
- Companies House API behaviour.
- Database schema.
- Report export persistence.
- Manual adverse persistence.
- Decision persistence.
- Watchlist persistence.
- Vercel settings.
- Route URLs.
- Authentication or user roles.
- External CCJ integration.
- Accounts/XBRL extraction.
- Stored binary PDFs.
- Heavy charting libraries.

## Known Limitations

- The Summary route still creates a live snapshot and score run by design.
- The workspace header remains read-only and may reflect the latest persisted check from before the Summary route creates a newer score.
- Report and decision remain separate route pages rather than a single combined workflow page.
- The Score History table is still horizontally scrollable where required because it preserves useful columns.

## Validation Performed

Required validation:

- `npm run lint`
- `npm run test`
- `npm run build`
- `git status --short`

Company-route smoke checks:

- `npm run smoke:companies-house -- 00445790`
- `npm run smoke:company-snapshot -- 00445790`
- `npm run smoke:score-run -- 00445790`

Browser checks should cover all company workspace routes at desktop, tablet and mobile widths.

## Next Task Recommendation

Recommended next task: **Task 12E - company workspace mobile polish and report/decision workflow details**.

Reason: the tab hierarchy is now simpler, so a focused pass can tune narrow-screen density, table ergonomics and the Reports & Decisions workflow without changing product logic.
