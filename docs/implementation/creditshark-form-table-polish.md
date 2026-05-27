# CreditShark Form and Table Polish

## What was polished

Task 12G improved form and table presentation across the company workspace and operational platform surfaces while keeping existing routes, server actions, validation and persistence unchanged.

## Primitives added or refined

Added form primitives:

- `Field`
- `TextInput`
- `Textarea`
- `Select`
- `FormSection`
- `FormActions`

Added table/list primitives:

- `ResponsiveTableShell`
- `EmptyTableState`

These components use Tailwind classes and CreditShark brand tokens, remain server-compatible and preserve normal HTML form submission.

## Forms updated

- Manual adverse event form now uses structured form sections for event details, value/status and source note/evidence.
- Manual adverse deactivate controls now use the shared field/input/button treatment.
- Decision form now uses structured sections for outcome, limits and review notes.
- Reviewer notes and override reason fields now have clearer helper text while preserving validation rules.
- Report export action uses the existing button primitive through normal server action form submission.

## Tables and lists updated

- Score history table now uses `ResponsiveTableShell`.
- Report filing and charge evidence tables now use `ResponsiveTableShell`.
- Watchlist table now uses `ResponsiveTableShell`, shared panel/header primitives and shared risk badges.
- Watchlist summary cards use the shared `MetricCard` primitive.
- Dashboard list styling was already component-backed from Task 12E and was left stable.

## Legacy CSS retained

Existing table classes, form grid classes, report print CSS, company workspace layout CSS and app shell CSS remain in place. The new primitives sit on top of the existing compatibility layer. Tailwind preflight remains disabled.

## Accessibility checks

- Form controls remain labelled through nested labels.
- Helper text is visible and practical.
- Button text remains explicit.
- Risk and status controls include text labels, not colour-only meaning.
- Tables retain semantic `table`, `thead`, `tbody`, `th` and `td` markup.
- Responsive wrappers preserve access to wide tabular data on mobile.

## What was deliberately not changed

- Scoring logic, score weights or risk-band storage.
- Snapshot creation or Companies House API behaviour.
- Database schema.
- Report export, manual adverse, decision or watchlist persistence.
- Route URLs.
- Vercel configuration.
- Report-only limitations or print controls.
- Tailwind preflight setting.

## Known limitations

- Tables remain horizontally scrollable on small screens where the content is genuinely tabular.
- Some legacy form/table CSS remains for compatibility and should be removed only after a broader visual QA pass.
- No client-side form library or data-grid library was introduced.

## Recommended next task

Task 12H should focus on public homepage and platform shell visual consistency using the established primitives, without changing product workflows.
