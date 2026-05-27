# CreditShark Simplified UX Plan

Plan date: 27 May 2026

Purpose: define the target route map, navigation model, company workspace structure, copy rules and staged simplification backlog for CreditShark.

Interpretation note: this plan should be read alongside `docs/brand/creditshark-brand-system.md` and `docs/audits/creditshark-ia-brand-alignment-addendum.md`. The brand system is the source of truth for future design, score-display, risk-label and copy decisions.

## A. Target Route Map

Public routes:

| Route | Status | Purpose |
|---|---|---|
| `/` | Now | Public landing page introducing CreditShark and the brand line `Trade Risk. Calmly Managed.` |
| `/sample-report` | Later | Public sample/report preview route. |
| `/pricing` | Later | Pricing and plan route. |
| `/about` or `/how-it-works` | Later | Plain explanation of how CreditShark supports SME trade-risk review. |

Logged-in app routes:

| Route | Status | Purpose |
|---|---|---|
| `/app` | Recommended new route | Platform home/dashboard. |
| `/search` | Existing, move into app shell | Company search. |
| `/watchlist` | Existing, move into app shell | Watched companies and monitoring foundation. |
| `/app/recent-checks` | Later | Recent checks list if dashboard summary becomes too dense. |
| `/app/reports` | Later | Report exports index. |
| `/app/decisions` | Later | Decision records index. |
| `/app/settings` | Later | Account/settings area. |

Company workspace routes:

| Route | Target surface |
|---|---|
| `/companies/[companyNumber]` | Company workspace Summary tab. |
| `/companies/[companyNumber]/score` | Company workspace Score & Reasons tab. |
| `/companies/[companyNumber]/adverse` | Company workspace Adverse Events tab. |
| `/companies/[companyNumber]/history` | Company workspace Score History tab. |
| `/companies/[companyNumber]/report` | Company workspace Reports & Decisions tab. |
| `/companies/[companyNumber]/decision` | Company workspace Reports & Decisions tab. |
| `/companies/[companyNumber]/financials` | Future Financials & Filings tab. |
| `/companies/[companyNumber]/people` | Future People & Control tab. |

Recommended route for logged-in landing page: `/app`.

Rationale:

- It creates a clear mental boundary between public marketing and authenticated platform work.
- It is shorter and more flexible than `/dashboard`.
- It lets the visible sidebar label still be `Dashboard`.
- It leaves room for `/app/reports`, `/app/decisions`, `/app/settings` and other authenticated routes later.

## B. Target Sidebar Navigation

MVP sidebar:

| Label | Route | Priority | Notes |
|---|---|---:|---|
| Dashboard | `/app` | P0 | Platform home with search and recent activity. |
| Company Search | `/search` | P0 | Explicit search route for focused company lookup. |
| Watchlist | `/watchlist` | P0 | Watched companies and monitoring foundation. |
| Recent Checks | `/app/recent-checks` or dashboard section | P1 | Can start as a dashboard section before becoming a route. |
| Reports | `/app/reports` or dashboard section | P1 | Index of report exports later. |
| Decisions | `/app/decisions` or dashboard section | P1 | Index of user-recorded decisions later. |
| Settings | `/app/settings` | P2 | Later. |

Navigation principles:

- Keep the left nav lean for MVP.
- Do not expose company sub-routes in global navigation.
- Do not expose public marketing links inside the app shell except via account/help/footer if needed.
- Use active-state clarity over decorative navigation.

## C. Target Company Tabs

Company workspace tabs:

| Tab | Route(s) | Purpose |
|---|---|---|
| Summary | `/companies/[companyNumber]` | Current decision summary and key evidence cards. |
| Score & Reasons | `/companies/[companyNumber]/score` | Reason codes, confidence, missing data and source-linked evidence. |
| Financials & Filings | Future `/companies/[companyNumber]/financials` | Accounts filing metadata, filing timeline and financial limitations. |
| Adverse Events | `/companies/[companyNumber]/adverse` | Companies House charges and manual adverse records. |
| People & Control | Future `/companies/[companyNumber]/people` | Officers, PSCs and governance context. |
| Score History | `/companies/[companyNumber]/history` | Score timeline and past runs. |
| Reports & Decisions | `/companies/[companyNumber]/report`, `/companies/[companyNumber]/decision` | Exports, decision records and report preview. |

Company header first viewport:

- Company name and number.
- Company status.
- Latest CreditShark check timestamp.
- Companies House evidence timestamp.
- Advisory score.
- Risk band.
- Recommended limit.
- Confidence.
- Top positive/review reasons.
- Manual-data indicator where relevant.
- Primary actions: Record decision, View report.
- Secondary actions: Add manual adverse event, Add/remove watchlist, Refresh latest check.

Avoid in first viewport:

- Long raw ids.
- Long legal disclaimers.
- Excessive audit metadata.
- Every possible action.
- Repeated footer-style legal blocks.

## D. Existing Route-To-New-Structure Mapping

| Existing surface | Target structure | Treatment |
|---|---|---|
| Public homepage | Public site `/` | Keep public; simplify to product promise, CTA, report preview and footer disclaimer only. |
| Search page | App shell Company Search | Keep route; make it feel like a platform task rather than public nav. |
| Watchlist page | App shell Watchlist plus dashboard summary | Keep route; remove repeated full guardrail; use recent activity and review-needed summaries. |
| Company profile | Company workspace Summary tab | Keep route; make it the canonical current risk view. |
| Score explanation | Company workspace Score & Reasons tab | Keep route; make it tabbed evidence. |
| Adverse page | Company workspace Adverse Events tab | Keep route; separate Companies House charges from manual data. |
| History page | Company workspace Score History tab | Keep route; label prior rows as history. |
| Report page | Company workspace Reports & Decisions tab | Keep route; reports can retain standalone limitations. |
| Decision page | Company workspace Reports & Decisions tab | Keep route; present as a workflow under the company workspace. |

## E. Copy Simplification Rules

Global rule:

- Use one concise global footer disclaimer across app and public surfaces.
- Do not repeat the full legal/compliance paragraph inside normal page cards, panels, headers or summaries.

Short labels to keep:

- Advisory score
- Latest CreditShark check
- Manual data included
- User-entered record
- User-recorded decision
- Source-linked evidence
- Companies House evidence
- Latest check
- History

Short contextual help that may remain:

- Manual entries are user-entered and shown separately from Companies House evidence.
- Historical rows are previous CreditShark checks, not the current risk view.
- Scores and recommended limits are advisory indicators.
- The user records any commercial decision.

Language to avoid:

- Consumer-credit language.
- Regulated-rating claims.
- Automated approval/rejection wording.
- Fear-led phrases.
- Shark gimmicks or puns.
- `safe` or `dangerous` as risk descriptions.

## F. Footer Disclaimer Standard

Use this exact footer disclaimer:

> CreditShark provides advisory trade-risk screening for UK limited companies only. It does not provide consumer credit reports, regulated credit ratings, lending decisions, credit broking, debt advice or debt collection services.

Recommended shared constant:

```ts
export const CREDITSHARK_FOOTER_DISCLAIMER =
  "CreditShark provides advisory trade-risk screening for UK limited companies only. It does not provide consumer credit reports, regulated credit ratings, lending decisions, credit broking, debt advice or debt collection services.";
```

## G. Report-Only Disclaimer Handling

Reports are allowed to retain standalone limitations because they can be saved, printed or shared outside the app.

Recommended report-only handling:

- Move report limitations into a dedicated shared constant, separate from footer copy.
- Include the report limitation on the report cover or final limitations section.
- Avoid repeating the same full limitation in multiple report sections.
- Keep source timestamps, model version, snapshot id, score run id, manual data labels and missing-data limitations in the report.
- Preserve manual-data separation from Companies House charges.
- Preserve the rule that CreditShark does not approve, decline, lend, broker credit or provide regulated ratings.

Recommended report-only constant:

```ts
export const CREDITSHARK_REPORT_LIMITATIONS =
  "This report provides advisory trade-risk screening for UK limited companies using available Companies House evidence, user-entered manual data where present, model version, source timestamps and visible limitations. It is not a consumer credit report, regulated credit rating, lending decision, credit broking service, debt advice or debt collection service. Any commercial decision is made and recorded by the user.";
```

## H. Implementation Backlog

### P0 - Simplify app shell and company workspace

- Add a clear app/public shell split.
- Introduce `/app` as authenticated platform home.
- Move `/search` and `/watchlist` visually into the app shell.
- Add company workspace header and tab navigation.
- Preserve deep-linkable company URLs.
- Remove duplicate company action stacks.
- Make Summary the first current-risk view.
- Reduce repeated full guardrail copy from app pages.
- Add shared footer disclaimer constant.
- Add shared report-only limitations constant.
- Keep manual-data and user-decision labels.

### P1 - Add dashboard and recent activity

- Add dashboard search.
- Add watchlist summary.
- Add recently checked companies.
- Add recent score movement cards.
- Add recent decisions.
- Add recent report exports.
- Add monitoring-event empty states.
- Add dashboard read-model tests.
- Add mobile dashboard state checks.

### P2 - Public homepage final polish

- Refine homepage around `Trade Risk. Calmly Managed.`
- Keep CTA focused on `Check a company`.
- Add sample/report preview concept.
- Add simple SME benefit explanation.
- Add future public route placeholders only when useful.
- Keep public nav minimal.
- Keep footer disclaimer only.

### Navigation labels

Use these labels consistently:

- Dashboard
- Company Search
- Watchlist
- Recent Checks
- Reports
- Decisions
- Settings
- Summary
- Score & Reasons
- Financials & Filings
- Adverse Events
- People & Control
- Score History
- Reports & Decisions

## I. Explicitly Deferred Items

Deferred until after navigation simplification:

- New database schema.
- New scoring model logic.
- New report export binary/PDF service.
- Continuous monitoring alerts.
- Licensed adverse-data integrations.
- User roles and team settings beyond what already exists.
- Pricing page implementation.
- Sample report public route implementation.
- Full financial extraction and trend analysis.
- Officer/PSC risk inference beyond light-touch company governance context.
- Any Vercel settings changes.
- Any route removal or redirect strategy that would break existing deep links.

## Implementation Phases

### Phase 1: Legal/disclaimer simplification and shared footer copy

Likely files:

- `src/lib/guardrails.ts`
- `app/layout.tsx`
- `app/page.tsx`
- `app/watchlist/page.tsx`
- `app/companies/[companyNumber]/page.tsx`
- `app/companies/[companyNumber]/score/page.tsx`
- `app/companies/[companyNumber]/adverse/page.tsx`
- `app/companies/[companyNumber]/decision/page.tsx`
- `app/companies/[companyNumber]/history/page.tsx`
- `app/companies/[companyNumber]/report/page.tsx`

Routes affected:

- `/`
- `/watchlist`
- All existing company routes

Risks:

- Removing report limitations by mistake.
- Weakening manual-data or decision-boundary clarity.
- Leaving stale imports after removing full guardrail blocks.

Validation checks:

- `npm run lint`
- `npm run test`
- `npm run build`
- Copy scan for duplicated full disclaimers.
- Manual review of report limitations.

What should not change:

- Scoring logic.
- Snapshot creation.
- Report export audit semantics.
- Database schema.
- Route URLs.

### Phase 2: App shell and dashboard route

Likely files:

- `app/layout.tsx`
- New app shell layout or route-group layout.
- New `app/app/page.tsx` or equivalent `/app` route.
- Dashboard read-model/service files under `src/lib`.
- Shared navigation components if introduced.

Routes affected:

- `/app`
- `/search`
- `/watchlist`

Risks:

- Public page accidentally inherits dense app chrome.
- App pages accidentally retain public marketing header.
- Dashboard ships without useful empty states.

Validation checks:

- Direct route checks for `/`, `/app`, `/search`, `/watchlist`.
- Desktop/tablet/mobile layout pass.
- `npm run lint`
- `npm run test`
- `npm run build`

What should not change:

- Companies House search behaviour.
- Watchlist persistence.
- Auth behaviour unless explicitly scoped.
- Vercel settings.

### Phase 3: Company workspace tab navigation

Likely files:

- New or updated `app/companies/[companyNumber]/layout.tsx`.
- Company workspace header component.
- Company tab navigation component.
- Existing company route pages.
- Shared CSS.

Routes affected:

- `/companies/[companyNumber]`
- `/companies/[companyNumber]/score`
- `/companies/[companyNumber]/adverse`
- `/companies/[companyNumber]/history`
- `/companies/[companyNumber]/report`
- `/companies/[companyNumber]/decision`

Risks:

- Duplicate data fetching for header and pages.
- Active tab mismatch for report/decision routes.
- Mobile tab overflow.
- Company profile route still creating a fresh snapshot while used as a tab, which may need a separate product decision later.

Validation checks:

- Open every company route directly.
- Confirm active tab state.
- Confirm browser back/forward works.
- Confirm mobile tab behaviour.
- `npm run lint`
- `npm run test`
- `npm run build`

What should not change:

- Existing URLs.
- Snapshot/scoring side effects.
- Decision creation.
- Manual adverse persistence.
- Report export persistence.

### Phase 4: Recent checks/watchlist dashboard integration

Likely files:

- Dashboard service/read model under `src/lib`.
- `/app` page.
- Existing watchlist/history/report/decision services as read sources.
- Focused tests for dashboard data shaping.

Routes affected:

- `/app`
- `/watchlist`

Risks:

- Dashboard queries become slow or brittle.
- Recent activity duplicates watchlist content without adding clarity.
- Empty states feel broken instead of helpful.

Validation checks:

- Service tests for empty and populated dashboard states.
- Browser checks for empty dashboard and populated dashboard.
- `npm run lint`
- `npm run test`
- `npm run build`

What should not change:

- Existing score history semantics.
- Watchlist mutation semantics.
- Decision/report audit records.

### Phase 5: Final public homepage polish

Likely files:

- `app/page.tsx`
- `app/globals.css`
- Future public route files only if separately scoped.

Routes affected:

- `/`
- Future `/sample-report`, `/pricing`, `/about` or `/how-it-works`

Risks:

- Public page becomes too workflow-heavy.
- Legal copy returns to hero/cards.
- Visual language becomes gimmicky or fear-led.

Validation checks:

- Desktop/tablet/mobile browser pass.
- Copy scan for regulated-rating, consumer-credit and shark-gimmick language.
- `npm run lint`
- `npm run test`
- `npm run build`

What should not change:

- App shell.
- Company workspace logic.
- Database schema.
- Vercel settings.
