# CreditShark App Dashboard Shell

Implementation date: 27 May 2026

## What Was Built

Task 12B adds a logged-in-style platform home and lightweight app shell for the current platform routes.

New route:

- `/app`

Platform routes now share a simple app shell:

- `/app`
- `/search`
- `/watchlist`

The public homepage remains public-facing and is not placed inside the platform shell.

## Route Structure

Current target structure:

- `/` - public homepage
- `/app` - platform dashboard
- `/search` - platform company search
- `/watchlist` - platform watchlist
- `/companies/[companyNumber]` and child routes - unchanged for now

Company workspace tabs are intentionally deferred to Task 12C.

## App Shell And Navigation Model

The app shell is implemented in `app/components/platform-shell.tsx`.

Navigation labels:

- Dashboard
- Company Search
- Watchlist

Recent Checks, Reports and Decisions are shown as dashboard sections only for now. Settings is omitted until there is real settings functionality.

The shell is intentionally lean so CreditShark feels SME-first and practical rather than like a dense corporate bureau product.

## Dashboard Sections

The `/app` dashboard includes:

- Header with `Dashboard`, `Trade risk, calmly managed.` and a practical explanation.
- Prominent company search form that submits to `/search`.
- Watchlist summary cards.
- Recently checked companies.
- Recent score movements.
- Recent user-recorded decisions.
- Recent report exports.
- Monitoring note.

The monitoring note states that automated monitoring and alerts are planned for a later phase. The dashboard does not claim continuous monitoring.

## Dashboard Read Model

The dashboard read model is implemented in:

- `src/lib/dashboard/dashboard-service.ts`

It exposes:

- `getDashboardOverview()`
- `buildDashboardOverview()`
- `formatDashboardMoney()`
- `formatDashboardValue()`

The service is server-side only and read-only. It uses existing persisted tables and does not create snapshots, score runs, decisions, report exports or watchlist records.

## Data Sources Used

The dashboard reads:

- `watchlists`
- `companies`
- `score_runs`
- `company_snapshots`
- `manual_adverse_events`
- `decision_records`
- `report_exports`
- `monitoring_events`

Recent checks are based on each company's latest score run.

Score movements are based on the latest two score runs for recently checked companies.

Recent decisions are based on user-recorded decision records.

Recent reports are based on report export records.

## Empty State Behaviour

If the database is not configured, `/app` shows a safe dashboard configuration state and keeps company search available.

If there are no watched companies, checks, decisions or report exports, the dashboard shows calm empty states rather than fake activity.

The dashboard does not invent monitoring events or alerts.

## What Was Deliberately Not Changed

- Authentication and user roles.
- Billing.
- Team settings.
- External CCJ integration.
- Companies House streaming API.
- Scheduled monitoring.
- Email alerts.
- Accounts/XBRL extraction.
- Scoring model logic.
- Database schema.
- Vercel configuration.
- Company route structure.
- Company workspace tabs.
- Watchlist add/remove semantics.
- Search persistence behaviour.

## Known Limitations

- `/app` is a platform landing page until authentication exists; it is not yet a user-specific authenticated dashboard.
- Dashboard activity is global to the current persisted data, not scoped to a signed-in user.
- Recent score movements use existing score runs only and do not represent live source-change monitoring.
- Settings is omitted until there is real functionality.

## Validation Performed

Required validation:

- `npm run lint`
- `npm run test`
- `npm run build`

Additional smoke checks:

- `npm run smoke:watchlist -- 00445790`
- `npm run smoke:score-history -- 00445790`

Browser checks should cover:

- `/`
- `/app`
- `/search`
- `/watchlist`

At desktop, tablet and mobile widths.

## Next Task Recommendation

Recommended next task: **Task 12C - Company workspace tab navigation**.

Reason: the platform shell and dashboard now provide the app-level navigation model, so the next simplification step should make company-specific routes feel like one coherent workspace while preserving deep links.
