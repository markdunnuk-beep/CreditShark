# CreditShark Navigation And IA Audit

Audit date: 27 May 2026

Scope: navigation, information architecture and UX simplification only. This audit does not propose database, scoring, Companies House, report-export or route-behaviour changes.

## A. Executive Summary

CreditShark has moved beyond a simple search/profile MVP. The current route set now supports search, live Companies House snapshots, advisory scoring, score explanation, manual adverse data, commercial decision recording, report preview/export, score history and watchlist workflows. The product value is clear, but the navigation model still behaves like a collection of feature pages rather than one calm trade-risk workspace.

The recommended IA is a three-surface model:

1. Public site: a simple public homepage at `/`, with future public routes for sample report, pricing and how-it-works.
2. Logged-in dashboard: a new `/app` platform home for search, watchlist, recent checks, recent decisions, report exports and monitoring summaries.
3. Company workspace: `/companies/[companyNumber]` as the visible workspace shell, with company-specific pages presented as tabs.

The most important simplification is not removing functionality. It is reducing the number of apparent choices and making the next commercial action obvious: check a company, review current risk, inspect evidence, record a decision, export a report, or watch the company.

The current global footer already uses the right concise disclaimer. Full legal/compliance guardrail blocks should be removed from normal page cards and retained only in exported/shareable report contexts. App surfaces should use short contextual labels such as `Advisory score`, `Latest CreditShark check`, `Manual data included`, `User-recorded decision` and `Source-linked evidence`.

## B. Current-Route Assessment

| Current route | Current role | Recommended IA role | Notes |
|---|---|---|---|
| `/` | Public landing page | Public route | Keep public. It should not expose dense app navigation. Use `Trade Risk. Calmly Managed.` as the brand line and keep the full disclaimer in the footer only. |
| `/search` | Company search | Logged-in app route, reachable from public CTA if auth is not present yet | Search is a platform task. In the target IA it should sit inside the app shell as Company Search, with the dashboard search field as the primary entry point. |
| `/watchlist` | Watchlist workflow | Logged-in app route | Keep as app-level navigation, not public. It should become one dashboard summary plus a dedicated Watchlist page. |
| `/companies/[companyNumber]` | Company profile and live check | Company workspace Summary tab | Keep as the canonical company workspace entry and first viewport. It should visually own the current risk view. |
| `/companies/[companyNumber]/score` | Score explanation | Company workspace tab: Score & Reasons | Keep deep-linkable, but present as a tab inside the company workspace. |
| `/companies/[companyNumber]/adverse` | Charges/manual adverse workflow | Company workspace tab: Adverse Events | Keep deep-linkable. Split evidence viewing from add/edit actions through clear in-tab actions. |
| `/companies/[companyNumber]/report` | Report preview/export | Company workspace tab: Reports & Decisions | Keep deep-linkable. Exported reports can keep standalone limitations. |
| `/companies/[companyNumber]/decision` | Decision recording workflow | Company workspace tab/action: Reports & Decisions | Keep deep-linkable. Make `Record decision` a primary company-header action when there is a current score. |
| `/companies/[companyNumber]/history` | Score history | Company workspace tab: Score History | Keep deep-linkable. Label historical rows as history, not current risk. |

Routes that should remain public:

- `/`
- Future `/sample-report`
- Future `/pricing`
- Future `/about` or `/how-it-works`

Routes that should move into a logged-in/app shell:

- `/search`
- `/watchlist`
- Future `/app`
- Future app-level `Recent Checks`, `Reports`, `Decisions` and `Settings`

Routes that should become company workspace tabs:

- `/companies/[companyNumber]`
- `/companies/[companyNumber]/score`
- `/companies/[companyNumber]/adverse`
- `/companies/[companyNumber]/history`
- `/companies/[companyNumber]/report`
- `/companies/[companyNumber]/decision`
- Future `/companies/[companyNumber]/financials`
- Future `/companies/[companyNumber]/people`

Secondary actions rather than top-level navigation:

- Refresh snapshot
- Re-run advisory score
- Record decision
- Record/export report
- Add manual adverse event
- Add/remove from watchlist
- Print/save report

Repeated or distracting legal/compliance copy:

- `app/companies/[companyNumber]/page.tsx` includes a page-level full guardrail after the company profile content.
- `app/companies/[companyNumber]/score/page.tsx` places the full guardrail in an `Advisory limitations` aside.
- `app/companies/[companyNumber]/adverse/page.tsx` repeats the full guardrail at the bottom of the adverse workflow.
- `app/companies/[companyNumber]/decision/page.tsx` repeats the full guardrail and also includes a decision-boundary paragraph.
- `app/companies/[companyNumber]/history/page.tsx` repeats the full guardrail near the top.
- `app/watchlist/page.tsx` repeats the full guardrail before the watchlist summary.
- `app/page.tsx` has a compact hero guardrail in addition to the global footer.
- `app/companies/[companyNumber]/report/page.tsx` repeats report disclaimers. This is acceptable in reports, but should be handled by report-only shared copy rather than page-level duplication.

Areas where the user has too many choices:

- The company profile action bar currently exposes review evidence, manual adverse events, preview report, score history, watchlist and record decision together.
- The company profile also repeats similar actions in a `Next actions` card and in individual workflow cards.
- The score page has its own header actions and an aside action stack.
- The watchlist row exposes Profile, History and Score links at table-row level, which is functional but dense for SME users.
- Decision and report pages contain workflow actions that should feel like part of one company workspace, not separate destinations.

## Journey Audit

Simplest first-time user journey:

1. Land on `/`.
2. Understand `Trade Risk. Calmly Managed.` and the plain SME value proposition.
3. Select `Check a company`.
4. Search by company name or Companies House number.
5. Open the company workspace.
6. See the latest CreditShark check immediately: status, advisory score, risk band, limit, confidence and top reasons.
7. Choose one next action: record decision, view report, add manual data, or add to watchlist.

Simplest returning user journey:

1. Land on `/app`.
2. See prominent company search, watchlist summary, recently checked companies and recent decisions/reports.
3. Continue a recent company or search a new one.
4. Open the company workspace on the Summary tab.

Immediately after logging in, the user needs:

- Search field.
- Watchlist items needing review.
- Recently checked companies.
- Recent score movements.
- Recent user-recorded decisions.
- Recent report exports.
- Clear empty states if no activity exists.

Immediately after searching a company, the user needs:

- Company name and number.
- Company status.
- Latest Companies House evidence timestamp.
- Latest CreditShark check timestamp.
- Advisory score, risk band, limit and confidence where available.
- Top reasons that explain the score.
- A small set of actions: record decision, view report, add manual adverse event and add/remove watchlist.

Workflow pages vs evidence tabs:

- Workflow pages/actions: search, refresh snapshot, re-run score, add manual adverse event, record decision, record/export report, add/remove watchlist.
- Evidence tabs: Summary, Score & Reasons, Financials & Filings, Adverse Events, People & Control, Score History, Reports & Decisions.

Actions that belong in the company header:

- Record decision
- View report
- Add manual adverse event
- Add/remove watchlist
- Refresh latest check, as a secondary action or overflow item

Actions that belong inside tabs:

- Score & Reasons: re-run advisory score, inspect reason-code detail.
- Adverse Events: add manual adverse event, deactivate/supersede manual entry.
- Reports & Decisions: record/export report, print/save PDF, view decision history.
- Score History: open latest score/report/decision links from historical context.
- Financials & Filings: refresh filings, open source filing when available.
- People & Control: open source officer/PSC records when available.

Actions that should be hidden until relevant:

- Print/save report until report preview is available.
- Decision override fields until a decision outcome requires them.
- Manual adverse deactivate/supersede controls until there is an active manual record.
- Score history trend visual until more than one check exists.
- Report export history until at least one export exists.
- Monitoring events until watchlist or source-change data exists.

Support for `Trade Risk. Calmly Managed.`:

The current app supports the promise functionally but not yet structurally. It has the data and guardrails, but the route-heavy model makes users work too hard to understand where they are. The proposed IA makes the promise more credible by making the current risk view immediate, the supporting evidence tabbed, and the next commercial action visible without making the product feel like a dense enterprise bureau.

## C. Brand-Fit Assessment Against `Trade Risk. Calmly Managed.`

The proposed navigation is a strong brand fit because it reduces visible complexity while preserving evidence depth. A public/app/company split allows the public page to stay benefit-led, the dashboard to feel operational, and the company workspace to remain commercially practical.

Brand-fit answers:

- Calm: yes, if the sidebar is lean and company tabs replace scattered action pages.
- Clarity: yes, because every surface gets one job: public explanation, operational dashboard, company review.
- Confidence: yes, because current risk, source timestamps, score reasons and user decisions are easier to locate.
- SME fit: yes, if the dashboard prioritises practical review tasks over bureau-style data menus.
- Risk awareness: yes, because risk signals remain visible but are grouped by decision value.
- Cash-flow protection: yes, because recommended limit, confidence, manual data and adverse evidence sit above the fold.
- Avoids bureau density: yes, if financials, people, history and reports sit in tabs instead of competing as top-level pages.
- Next commercial action: improved, because `Record decision`, `View report`, `Add manual adverse event` and `Watchlist` become contextual header actions.
- Avoids fear-led language: yes, provided score/risk copy remains calm and words such as `safe`, `dangerous`, `approved` and `rejected` are avoided except where clearly user-recorded.
- Public/app split: yes, because the public site can explain the product simply without showing every workflow route.

## D. Public/App/Company Workspace Separation

Public site:

- Purpose: explain CreditShark, build trust, and route users into the company-check workflow.
- Tone: calm, benefit-led, SME-focused.
- Navigation: minimal public nav only.
- CTA: `Check a company`.
- Disclaimer: footer only.

Logged-in app:

- Purpose: help users check companies, monitor risk, continue recent work and manage outputs.
- Tone: operational, clear, low-friction.
- Navigation: left sidebar.
- Primary object: the user's company review activity.

Company workspace:

- Purpose: review one company, current risk, supporting evidence, decisions and reports.
- Tone: practical and evidence-led.
- Navigation: company header plus tabs.
- Primary object: latest CreditShark check.

## E. Proposed Dashboard Model

Recommended route: `/app`.

Why `/app`:

- It clearly separates authenticated platform work from the public site.
- It leaves `/dashboard` available as a label rather than a hard product boundary.
- It avoids making every logged-in surface look like a generic analytics dashboard.
- It aligns with the intended public/app split and future authenticated routes.

Dashboard sections:

- Prominent company search.
- Watchlist summary.
- Recently checked companies.
- Recent score movements.
- Recent user-recorded decisions.
- Recent report exports.
- Basic monitoring events where available.
- Empty states for first use.

Lean left-hand navigation:

- Dashboard
- Company Search
- Watchlist
- Recent Checks
- Reports
- Decisions
- Settings, later

The dashboard should answer:

- Who should I check next?
- Which watched companies need attention?
- Which companies did I review recently?
- Has any score moved?
- Which decisions or reports need follow-up?

## F. Proposed Company Workspace Tab Model

Recommended company route model:

- Keep `/companies/[companyNumber]` as the canonical Summary route.
- Keep existing child routes as deep-linkable URLs.
- Present all company routes inside one visual workspace shell with shared company header and tab navigation.

Recommended tabs:

- Summary
- Score & Reasons
- Financials & Filings
- Adverse Events
- People & Control
- Score History
- Reports & Decisions

Existing route mapping:

| Existing route | Target tab |
|---|---|
| `/companies/[companyNumber]` | Summary |
| `/companies/[companyNumber]/score` | Score & Reasons |
| `/companies/[companyNumber]/adverse` | Adverse Events |
| `/companies/[companyNumber]/history` | Score History |
| `/companies/[companyNumber]/report` | Reports & Decisions |
| `/companies/[companyNumber]/decision` | Reports & Decisions |
| Future `/companies/[companyNumber]/financials` | Financials & Filings |
| Future `/companies/[companyNumber]/people` | People & Control |

Implementation recommendation:

Use a practical Next.js structure that preserves deep links but presents one company workspace:

- Shared company workspace layout for `/companies/[companyNumber]` and children.
- Tab links render as navigation, not client-only state.
- Each tab can remain a separate route/page for server data loading and shareability.
- `/report` and `/decision` can remain distinct URLs but appear under one `Reports & Decisions` tab, with an in-tab segmented control or action state.

## G. Legal/Compliance Copy Simplification

Current issue:

The app repeats long advisory/legal copy in normal workflow surfaces. This protects the boundary, but it makes the product feel defensive and increases cognitive load.

Rule:

Use one concise global footer disclaimer only:

> CreditShark provides advisory trade-risk screening for UK limited companies only. It does not provide consumer credit reports, regulated credit ratings, lending decisions, credit broking, debt advice or debt collection services.

Remove full disclaimer blocks from:

- Company Summary page normal body.
- Score & Reasons normal aside.
- Adverse Events normal body.
- Decision workflow normal body.
- Score History normal body.
- Watchlist normal body.
- Public homepage hero.

Keep short contextual labels:

- Advisory score
- Latest CreditShark check
- Manual data included
- User-entered record
- User-recorded decision
- Source-linked evidence
- Latest check
- History
- Companies House evidence

Report-only handling:

- Exported reports should keep standalone limitations because they may be saved/shared outside the app.
- Report limitations should live in one report-only shared constant.
- Report pages can include limitation copy in the report document, not repeated across every report section.
- App report preview controls can use short labels such as `Preview only`, `Export recorded` and `Advisory report`.

Recommended shared copy constants:

- `CREDITSHARK_FOOTER_DISCLAIMER`
- `CREDITSHARK_REPORT_LIMITATIONS`
- `ADVISORY_SCORE_LABEL`
- `LATEST_CHECK_LABEL`
- `MANUAL_DATA_INCLUDED_LABEL`
- `USER_RECORDED_DECISION_LABEL`
- `SOURCE_LINKED_EVIDENCE_LABEL`

## H. Mobile/Navigation Recommendations

App shell:

- Desktop: persistent left sidebar, top utility/search area, main content.
- Tablet: collapsible sidebar or compact rail.
- Mobile: menu button opens a drawer; the main content starts with the page's primary task.

Top header:

- Public pages: wordmark, minimal public nav, primary CTA.
- App pages: compact top bar with global search, account/help area later, and no repeated public marketing content.

Company workspace header:

- Company name and number.
- Company status.
- Latest CreditShark check timestamp.
- Companies House evidence timestamp.
- Advisory score, risk band, recommended limit and confidence.
- Primary actions: Record decision, View report.
- Secondary actions: Add manual adverse event, Add/remove watchlist, Refresh latest check.

Company tabs:

- Desktop: horizontal tab row below company header.
- Tablet: horizontal scroll tab row with clear active state.
- Mobile: horizontal scroll tabs or a compact tab dropdown.
- Keep tab labels short and stable.

Mobile behaviour:

- Sidebar collapses to menu/drawer.
- Company tabs become horizontal scroll or dropdown.
- Main score summary remains first.
- Actions collapse into a compact action group.
- Footer disclaimer remains concise.
- Audit metadata stays in details/accordion patterns.

## I. Main Risks

- Over-consolidation risk: collapsing too much into one route could make server data loading and shareability worse. Mitigation: keep deep-linkable child routes.
- Compliance risk: removing long legal blocks from app cards could weaken guardrails if labels are also removed. Mitigation: keep footer disclaimer, report limitations and short contextual labels.
- Workflow confusion risk: merging report and decision under one tab could hide primary actions. Mitigation: keep header CTAs and segment the tab clearly.
- Dashboard data risk: recent checks, decisions and exports require reliable read models. Mitigation: start with existing persisted data and clear empty states.
- Mobile tab risk: too many tabs can become cramped. Mitigation: short labels, horizontal scroll, or dropdown.
- Brand risk: copying bureau patterns too closely would make CreditShark feel enterprise-heavy. Mitigation: use category references only for hierarchy, not visual imitation.

## J. Recommended Implementation Phases

Phase 1: legal/disclaimer simplification and shared footer copy.

- Likely files: `src/lib/guardrails.ts`, `app/layout.tsx`, route pages that import `CREDITSHARK_PRODUCT_GUARDRAIL`, report copy module if added.
- Routes affected: `/`, `/watchlist`, company routes, report route.
- Risks: accidentally removing report limitations or manual-data labels.
- Validation: lint, tests, build, copy scan for banned/duplicated legal blocks.
- Do not change: scoring, report data, database schema, Companies House logic.

Phase 2: app shell and dashboard route.

- Likely files: `app/layout.tsx` or route-group layouts, new `app/app/page.tsx`, dashboard read models under `src/lib`.
- Routes affected: `/app`, `/search`, `/watchlist`.
- Risks: public/app shell conflicts, auth assumptions, empty-state quality.
- Validation: route smoke checks, responsive layout checks, lint/test/build.
- Do not change: search API semantics or watchlist persistence.

Phase 3: company workspace tab navigation.

- Likely files: `app/companies/[companyNumber]/layout.tsx`, company route pages, shared company header/tab components.
- Routes affected: all `/companies/[companyNumber]` routes.
- Risks: duplicate data fetching, stale header data, unclear active tab.
- Validation: direct URL checks for each tab, browser responsive checks, lint/test/build.
- Do not change: route URLs, scoring side effects, snapshot creation behaviour unless separately scoped.

Phase 4: recent checks/watchlist dashboard integration.

- Likely files: dashboard read models, watchlist service, history/report/decision services.
- Routes affected: `/app`, `/watchlist`.
- Risks: slow dashboard queries, confusing empty states.
- Validation: service tests for dashboard summaries, build, browser checks with empty and populated data.
- Do not change: score calculations, report export audit semantics.

Phase 5: final public homepage polish.

- Likely files: `app/page.tsx`, public CSS, future sample-report/pricing/about pages.
- Routes affected: `/`, future public routes.
- Risks: overloading homepage with app workflow details.
- Validation: browser checks at desktop/tablet/mobile, copy scan for consumer-credit or regulated-rating language.
- Do not change: app routes or workflow logic.
