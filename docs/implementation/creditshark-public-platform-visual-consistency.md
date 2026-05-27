# CreditShark Public and Platform Visual Consistency

## What was polished

Task 12H aligned the public homepage and core platform routes with the CreditShark brand system and the Tailwind/design primitive foundation. The work focused on visual consistency, clearer hierarchy and calmer SME-facing copy without changing workflows or data loading.

## Homepage changes

- Reframed the hero around `Trade Risk. Calmly Managed.`
- Updated the H1 and supporting copy to focus on SME credit insight and practical trade-risk awareness.
- Replaced older preview markup with `Card`, `SectionHeader`, `TradeRiskScoreGauge`, `MetricCard`, `Badge`, `EvidenceChip`, `Notice`, `ActionGroup` and `ButtonLink`.
- Added a lightweight conceptual company workspace preview without fake adverse claims or regulated-rating language.
- Added SME benefit and workflow sections around understanding trading partners, spotting risk earlier, protecting cash flow and recording decisions.

## Platform shell changes

- Polished the left navigation with calmer surfaces, active state treatment and brand-aligned sidebar copy.
- Kept navigation lean: Dashboard, Company Search and Watchlist.
- Kept public `/` outside the app shell.
- Did not expose company tabs globally.

## Dashboard, search and watchlist changes

- `/app` now uses shared form/button/card/detail primitives for the search card and monitoring note.
- `/search` now uses shared field/input/button/badge/evidence/notice primitives while preserving server-side Companies House search.
- `/watchlist` retains the workflow-aid framing and uses the shared table, card, metric, risk and notice primitives already established.

## Primitives used

- `Button`
- `ButtonLink`
- `Card`
- `Badge`
- `SectionHeader`
- `MetricCard`
- `EvidenceChip`
- `RiskBadge`
- `TradeRiskScoreGauge`
- `Notice`
- `ActionGroup`
- `DetailList`
- `Field`
- `TextInput`
- `ResponsiveTableShell`

## What was deliberately not changed

- Scoring logic or risk-band storage.
- Snapshot creation behaviour.
- Companies House API behaviour.
- Database schema.
- Report export, manual adverse, decision or watchlist persistence.
- Route URLs.
- Vercel configuration.
- Tailwind preflight setting.
- Report-only limitations.
- Authentication, pricing or sample-report routes.

## Browser checks

Browser checks should cover `/`, `/app`, `/search`, `/search?query=00445790`, `/watchlist` and `/companies/00445790` at desktop, tablet and mobile widths. Confirm that the public homepage remains public-facing, platform routes feel coherent, company routes still render, footer legal copy appears once and no false auth or monitoring claims are introduced.

## Known limitations

- Some legacy global CSS remains for compatibility.
- The homepage product preview is conceptual and does not introduce a new sample-report route.
- Platform dashboard remains a no-auth platform landing page until authentication is implemented.

## Recommended next task

Task 12I should focus on small visual QA fixes from live/browser use, especially spacing consistency and any remaining legacy card/list classes that can be safely migrated.
