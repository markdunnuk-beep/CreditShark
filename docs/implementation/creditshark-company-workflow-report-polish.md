# CreditShark Company Workflow And Report Polish

Date: 26 May 2026

## What Changed

Task 8B improved the dense company workflow surfaces without changing scoring logic, score weights, snapshot creation, report export persistence, manual adverse persistence, Companies House API behaviour, database schema or Vercel settings.

The pass focused on hierarchy, readability and report-grade presentation:

- Company profile now leads with a stronger advisory score, risk band, recommended limit and confidence surface.
- Top reasons are split into `What helps` and `What needs review`.
- Long snapshot and score metadata is moved into secondary audit details.
- Score explanation now shows top score drivers before the full reason-code list.
- Reason rows have clearer source chips, direction treatment and manual-data labelling.
- Manual adverse page separates Companies House charges from user-entered manual data more strongly.
- Manual adverse forms are grouped into event details, value/status, and source/evidence sections.
- Inactive and superseded manual history is collapsed by default.
- Report preview has a stronger cover, clearer export status banner and more report-specific section treatment.

## Audit Issues Addressed

The UI/UX audit identified that the company workflow had the right data but did not lead strongly enough with the core trade-risk answer. The profile now puts advisory score, recommended limit, confidence and top reasons ahead of the evidence grid.

The audit also noted repetitive reason-code rows, visually heavy IDs, plain manual adverse history and a report preview that felt more like web cards than a finance-grade report. This task adds workflow-specific visual primitives and de-emphasises audit metadata while preserving it.

## Routes Touched

- `/companies/[companyNumber]`
- `/companies/[companyNumber]/score`
- `/companies/[companyNumber]/adverse`
- `/companies/[companyNumber]/report`

Shared styling was updated in `app/globals.css`.

## Visual Primitives Added Or Refined

- Decision summary panel
- Recommended limit card
- Confidence explanation strip
- Driver groups for positive and review factors
- Missing-data warning
- Manual-data warning
- Source chip variants for Companies House, manual data, model and evidence
- Secondary audit details block
- Evidence cards for public-source and manual-source sections
- Collapsed inactive manual history
- Report export status banner
- Report cover summary grid

## Deliberately Not Changed

- No scoring logic or score weights changed.
- No snapshot creation behaviour changed.
- No database tables or migrations were added.
- No report export persistence logic changed.
- No manual adverse event create, supersede or deactivate logic changed.
- No external assets, component libraries or PDF generation dependencies were added.
- No auth, watchlist, decision workflow, external CCJ integration or accounts extraction was added.
- No Vercel configuration was added or changed.

## Remaining Polish Items

- Build a proper recorded decision workflow once user decisions are in scope.
- Create a watchlist row system and portfolio overview.
- Add route-level loading states if the app introduces client-side transitions later.
- Consider a synthetic public sample report instead of linking to a live company report preview.
- Continue refining report print QA against actual browser-saved PDFs.

## Next Functional Task Recommendation

The next functional task should be the decision record workflow: allow a user to record an explicit `approve`, `refer` or `decline/reject`-style commercial decision using calm language, reviewer notes, requested limit, recommended limit, final approved limit and audit metadata. The advisory score should remain decision support, not an automated final decision.
