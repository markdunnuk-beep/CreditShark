# CreditShark Brand Polish Backlog

This backlog translates the UI/UX audit into implementation-ready polish work. It is visual and copy-structure work only unless a future task explicitly changes product logic.

## P0 - Visual Polish Before Further Feature Expansion

### 1. Public Landing Hero And CTA

Problem:

The homepage is clear but too plain for a commercial UK SME finance SaaS product.

Tasks:

- Replace "MVP workflow" language with customer-facing benefit copy.
- Add a secondary CTA: `View sample report`.
- Add a product/report preview panel using existing app data concepts.
- Add a trust/proof row without regulated claims.
- Make the hero feel like the first viewport of a real product, not an internal prototype.

Acceptance criteria:

- H1 remains `UK company credit checks before you trade`.
- Page includes clear path to `/search`.
- No fake AI, lending, regulated-rating or consumer-credit claims.
- No external screenshots or copied layouts.

### 2. App Shell And Header Polish

Problem:

The header is functional but tall on mobile and disabled nav items make the app feel unfinished.

Tasks:

- Tighten header spacing across desktop/tablet/mobile.
- Add clearer active/current route treatment.
- Replace disabled Watchlist/Reports nav labels with subtler "coming later" treatment or remove until built.
- Improve wordmark weight/spacing while staying wordmark-first.
- Reduce vertical header footprint on mobile.

Acceptance criteria:

- Header remains accessible and keyboard navigable.
- No shark mascot or novelty mark.
- Guardrail label remains visible but less visually heavy.

### 3. Shared UI Primitives

Problem:

Most panels currently use similar generic card styling.

Tasks:

- Create reusable visual patterns for:
  - `DecisionSummaryCard`
  - `RecommendedLimitCard`
  - `SourceEvidenceChip`
  - `ManualDataBadge`
  - `MissingDataWarning`
  - `RiskBadge`
  - `ReportSection`
- Define spacing rules for section stacks, compact cards and report sections.
- Keep cards for genuine repeated items and tools only.

Acceptance criteria:

- Existing product logic is unchanged.
- Components use the current brand tokens.
- Risk colours remain functional, not decorative.

### 4. Search Route Polish

Problem:

Search works but has stale implementation copy and flat result hierarchy.

Tasks:

- Remove "next build slice" copy.
- Improve empty state and no-result state.
- Make exact company-number match a stronger badge.
- Improve result card hierarchy: name, number, status, locality, date, action.
- Add calmer API/config error state styling.
- Improve mobile result spacing.

Acceptance criteria:

- Search still performs server-side Companies House search.
- API key remains server-only.
- No persistence is added in this polish task.

### 5. Company Profile Decision Summary

Problem:

The profile has the right data but does not prioritise the core trade-risk answer strongly enough.

Tasks:

- Make score, risk band, confidence and recommended limit the dominant first-viewport content.
- Add a plain basis line for recommended limit.
- Show top reasons as "what helps" and "what needs review".
- Move long snapshot ids into an audit/details area.
- Clarify refresh snapshot behaviour without repetitive copy.

Acceptance criteria:

- Score is never shown without reasons, timestamps and data limitations.
- Copy avoids "approved", "rejected", "safe" and "dangerous".
- Manual adverse and report actions remain visible.

### 6. Score Explanation Readability

Problem:

Reason-code detail is comprehensive but visually repetitive.

Tasks:

- Improve grouped reason-code sections.
- Differentiate positive, negative and missing reasons without overusing red.
- Improve source chip hierarchy and source date visibility.
- Add a short confidence explanation.
- Add top score drivers before the full reason list.

Acceptance criteria:

- All persisted reason-code fields remain visible or accessible.
- Source-linked explanation remains central.
- Manual data warning remains prominent when applicable.

### 7. Manual Adverse Event UX

Problem:

The adverse page is clear but form/history presentation is plain and can become noisy.

Tasks:

- Group form fields into event details, value/status and source note.
- Improve active vs inactive/superseded visual states.
- Add stronger manual-data warning component.
- Improve post-submit/re-score guidance.
- Collapse or summarise inactive history by default.

Acceptance criteria:

- Manual data is always labelled.
- Supersede/deactivate logic is unchanged.
- No external CCJ integration is added.

### 8. Report Preview Styling

Problem:

The report is complete but not yet finance-report grade.

Tasks:

- Strengthen report cover hierarchy.
- Remove repeated title feel.
- Improve report tables and reason-code detail layout.
- Add export-recorded status banner.
- Refine print styles for page breaks and contrast.
- Reduce repeated disclaimer visual weight while preserving required copy.

Acceptance criteria:

- Report preserves snapshot id, score run id, model version, timestamps and limitations.
- Print controls remain hidden in print.
- No server-side PDF dependency is introduced.

### 9. Mobile Spacing And Stacking

Problem:

Mobile has no overflow but pages are long and utilitarian.

Tasks:

- Reduce mobile header height.
- Improve stacked card spacing.
- Make primary actions easier to find after long evidence sections.
- Consider section anchors for company workflow pages.
- Make report preview less dense on narrow screens.

Acceptance criteria:

- No horizontal overflow at 390px.
- Tap targets remain at least roughly 44px for primary actions.

## P1 - Polish During Decision/Watchlist Work

### 1. Decision Workflow Cards

- Add user-decision cards for approve/refer/reject as recorded user decisions, not automated outcomes.
- Show requested limit, recommended limit, approved limit and reviewer notes.
- Use calm decision language and visible override rationale.

### 2. Watchlist Row System

- Design company watchlist rows with company, band, latest event, last refresh and next action.
- Keep rows dense but readable.
- Use warning states only for meaningful change events.

### 3. Portfolio Summary Cards

- Add compact portfolio metrics once watchlist exists.
- Avoid marketing-dashboard decoration.
- Prioritise review queues and exposure context.

### 4. Empty And Loading States

- Add route-specific empty/loading/error states for search, reports, adverse data, watchlist and decision records.
- Keep copy benefit-led and practical.

### 5. Audit Trail Styling

- Create audit trail row pattern with actor, action, entity, timestamp and metadata summary.
- Keep raw ids available but visually secondary.

## P2 - Later Marketing / Commercial Polish

### 1. Sample Report Visual

- Build a public-facing sample report preview from synthetic data.
- Keep it clearly illustrative and non-regulated.
- Do not use real company adverse claims.

### 2. Public Pricing Section

- Add neutral pricing/plan cards when commercial model is known.
- Avoid lending marketplace language.

### 3. Customer Trust / Proof Section

- Add proof points such as source-linked evidence, transparent model versioning and audit-ready exports.
- Do not imply regulatory authorisation.

### 4. Illustration Or Abstract Product Graphics

- If needed, create restrained abstract product graphics using CSS or generated internal assets.
- Avoid cartoon sharks, teeth, jaws, blood and gimmicks.

### 5. Logo / Mark Exploration

- Keep wordmark-first.
- Explore a subtle fin/check/signal badge only after core UI polish.
- Ensure one-colour fallback works for reports.

## Explicit Avoid List

Avoid:

- Shark novelty branding.
- Dark enterprise intelligence aesthetic.
- Regulated-rating claims.
- Consumer-credit language.
- Lending, broking or debt-advice cues.
- Fake AI claims.
- Overusing red.
- Copying Capitalise, Funding Circle, Creditsafe, Sonartra or any other named site.
- Adding visual polish that changes scoring, snapshot, manual adverse or report logic.

## Recommended Next Task Split

Use two implementation tasks:

### Task 8A - Public/Home/Search Visual Polish

Scope:

- Landing page hero.
- Product/report preview concept.
- Trust/proof row.
- App shell/header.
- Search states and search result cards.

Reason:

This improves first impression and acquisition credibility without touching dense credit-review workflows.

### Task 8B - Company Workflow/Report Visual Polish

Scope:

- Company profile decision summary.
- Score explanation reason rows.
- Manual adverse page.
- Report preview and print styling.
- Shared chips/badges/cards used by workflow pages.

Reason:

The company workflow has deeper data density and should be polished as a coherent decision-support surface.
