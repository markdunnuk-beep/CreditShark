# CreditShark Tailwind Design System Foundation

## What changed

Task 12E added Tailwind CSS as a front-end foundation while preserving the existing global CSS, route structure and product logic. The task created a small CreditShark-specific component layer and refactored a limited set of low-risk surfaces to prove the design system works before wider migration.

## Tailwind setup

- Installed `tailwindcss`, `postcss` and `autoprefixer`.
- Added `tailwind.config.ts` with content scanning for `app/**/*.{ts,tsx}` and `src/**/*.{ts,tsx}`.
- Added `postcss.config.mjs`.
- Added Tailwind directives to `app/globals.css`.
- Disabled Tailwind preflight in the config so existing app, report and print styles continue to work during migration.

## Brand token mapping

The Tailwind theme maps the canonical CreditShark brand colours:

- `creditshark.navy`: `#0D2B45`
- `creditshark.teal`: `#1CA3A6`
- `creditshark.aqua`: `#6DD1D6`
- `creditshark.mist`: `#F0F2F4`
- `creditshark.white`: `#FAFBFC`

Supporting tokens were also added for ink, muted text, borders, warm surfaces and risk states:

- `risk.low`
- `risk.moderate`
- `risk.elevated`
- `risk.high`

Existing CSS variables remain in place for compatibility.

## Component primitives created

Created `app/components/ui/` with:

- `Button` and `ButtonLink`
- `Card`
- `Badge`
- `SectionHeader`
- `MetricCard`
- `EvidenceChip`
- `RiskBadge`
- `TradeRiskScoreGauge`
- `cx` class composition helper

The primitives are intentionally small, server-compatible and CreditShark-specific. They do not introduce an external UI kit or charting library.

## Proof surfaces refactored

The following low-risk surfaces now use the new primitives:

- `/app`: dashboard summary cards, dashboard panels and recent-check risk badges.
- `/search`: search panel and exact-match badge.
- Company workspace header: current advisory score gauge, risk badge and metric cards.

No data loading, persistence, scoring or route behaviour was changed.

## What was deliberately not changed

- Scoring logic and score weights.
- Snapshot creation behaviour.
- Companies House API behaviour.
- Database schema.
- Report export, manual adverse, decision or watchlist persistence.
- Route URLs.
- Vercel configuration.
- Report print CSS.
- Full app-wide visual redesign.

## Known limitations

- Most legacy global CSS remains in use and should be migrated gradually.
- Tailwind preflight is disabled for compatibility, so base element normalization still comes from existing global styles.
- The score gauge is a simple SVG/CSS primitive, not a charting system.
- Current persisted risk-band values are displayed safely but not renamed in storage or scoring logic.

## Recommended next task

Task 12F should migrate a small additional set of stable UI surfaces to the new primitives, starting with repeated company tab cards and evidence chips. Keep the migration incremental so report print styling and company workflow behaviour remain stable.
