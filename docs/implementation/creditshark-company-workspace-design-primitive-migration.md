# CreditShark Company Workspace Design Primitive Migration

## What was migrated

Task 12F continued the Tailwind/design-system migration across selected company workspace surfaces. The work focused on repeated card, notice, detail-list, reason-code and action-group patterns while preserving all existing company routes and product logic.

## Primitives added or refined

Added reusable UI primitives under `app/components/ui/`:

- `Notice` for info, caution, manual, missing, report, error and success states.
- `ActionGroup` for compact action clusters.
- `DetailList` for audit details and metadata rows.
- `EvidencePanel` for structured evidence cards.
- `ReasonCodeCard` plus reason-code formatting helpers.
- `ReportSection` for print-aware report section wrapping.
- `formatUiValue` utility.

Existing primitives such as `Card`, `Badge`, `MetricCard`, `EvidenceChip`, `RiskBadge`, `Button`, `ButtonLink` and `SectionHeader` were reused.

## Routes touched

- `/companies/[companyNumber]`
- `/companies/[companyNumber]/score`
- `/companies/[companyNumber]/adverse`
- `/companies/[companyNumber]/history`
- `/companies/[companyNumber]/report`
- `/companies/[companyNumber]/decision`

## Tab-by-tab changes

### Summary

- Current-risk and action areas now use `Card`, `SectionHeader`, `ActionGroup`, `ButtonLink` and `Notice`.
- Key evidence and trade context areas now use `EvidencePanel`, `MetricCard`, `DetailList`, `EvidenceChip` and `Badge`.
- Audit details remain available but are presented through `DetailList`.

### Score & Reasons

- Score sections now use `Card`, `SectionHeader`, `Badge`, `RiskBadge` and `Notice`.
- Full reason-code detail now uses `ReasonCodeCard`, keeping reason label, explanation, group, weight, source, source date and source id visible.

### Adverse Events

- Companies House charge summary and manual-record summary now use `EvidencePanel`, `EvidenceChip`, `Badge`, `DetailList` and `Button`.
- Manual event records use `DetailList` and status badges while preserving form actions and validation.

### Score History

- Movement summary uses `MetricCard`.
- History sections use `Card`, `SectionHeader`, `ActionGroup`, `ButtonLink`, `RiskBadge`, `Badge` and `EvidenceChip`.
- The existing lightweight SVG trend remains in place.

### Reports & Decisions

- Report controls use `ActionGroup`, `Button` and `ButtonLink`.
- Report sections use `ReportSection` while preserving report document classes and report-only limitations.
- Decision recommendation, form and history sections use `Card`, `EvidencePanel`, `SectionHeader`, `DetailList`, `RiskBadge`, `Badge`, `Button` and `Notice`.

## Legacy CSS retained

The migration deliberately retained broad legacy CSS, report print styles, table wrappers, form layouts, company shell styles and responsive behaviour. Tailwind preflight remains disabled.

## What was deliberately not changed

- Scoring logic and score weights.
- Snapshot creation behaviour.
- Companies House API behaviour.
- Database schema.
- Report export, manual adverse, decision or watchlist persistence.
- Route URLs.
- Vercel configuration.
- Report-only limitations.
- Print controls and report print CSS.

## Browser checks

Browser checks should cover company Summary, Score & Reasons, Adverse Events, Score History, Report and Decision routes at desktop, tablet and mobile viewports. Checks should confirm no horizontal overflow, correct active tabs, no console errors, report limitations preserved and no repeated full legal blocks.

## Known limitations

- Some legacy classes remain intentionally for layout compatibility.
- Company forms are still mostly global CSS based.
- Tables remain conventional HTML tables with responsive wrappers.
- This is not a full visual redesign of every company tab.

## Recommended next task

Task 12G should focus on a tighter visual pass for forms and tables, especially manual adverse entry, decision recording and report table polish, using the primitives established here.
