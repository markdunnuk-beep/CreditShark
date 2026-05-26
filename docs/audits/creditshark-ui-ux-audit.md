# CreditShark UI/UX Audit

Audit date: 26 May 2026  
Local app: `http://localhost:3004` after port `3000` was found busy with an older dev server.  
Test company: TESCO PLC, `00445790`.

## A. Executive Summary

CreditShark is a functional and credible MVP with the right product foundations: source timestamps, advisory guardrails, score reasons, manual adverse data, and report export context are visible across the workflow. It already avoids shark novelty, consumer-credit language, dark surveillance styling and regulated-rating claims.

The UI currently reads as a solid engineering MVP rather than a polished UK SME finance SaaS product. The colour system and copy direction are on-brand, but the pages rely heavily on plain cards, repeated text blocks, large legalistic guardrails, and uniform component treatment. The product does answer "what is the score, limit and why?", but the visual hierarchy does not yet make that answer feel premium or immediate.

The strongest surfaces are the company profile and report preview because they expose real product value. The weakest surface is the public landing page, which lacks trust/proof signals, product preview depth and commercial polish. Search is usable but still has placeholder copy and limited result refinement. Mobile is structurally sound with no horizontal overflow found, but stacking creates long pages and the header consumes too much vertical space.

Recommended next step: split polish into two tasks. Do public/home/search polish first, then company workflow/report polish.

## B. Overall Score and Route-Level Scores

Overall visual/product readiness: **6.4 / 10**

Rubric interpretation: credible MVP, needs polish before it feels like good early commercial SaaS.

| Area | Score | Rationale |
|---|---:|---|
| Overall brand alignment | 6.8 | Palette, copy guardrails and calm tone align, but execution is generic and lacks distinctive CreditShark identity. |
| Overall UX clarity | 7.1 | Core journeys and evidence are understandable; action hierarchy and repeated guardrail copy need refinement. |
| Overall mobile readiness | 6.7 | No overflow found; stacking works, but pages become long and header/controls take too much vertical space. |
| Overall paid-user credibility | 6.2 | Data depth is promising, but landing, report polish and workflow visual hierarchy are not yet paid-acquisition quality. |

Route scores:

| Route | Score | Summary |
|---|---:|---|
| `/` | 5.6 | Clear but too basic; lacks trust proof, report/product preview and premium SaaS landing rhythm. |
| `/search` | 6.4 | Functional and responsive; result cards need stronger disambiguation, status styling and updated copy. |
| `/companies/[companyNumber]` | 7.0 | Strongest app surface; score, limit and evidence are present but need sharper decision hierarchy. |
| `/companies/[companyNumber]/score` | 6.8 | Useful evidence trail; reason rows are readable but dense and visually repetitive. |
| `/companies/[companyNumber]/adverse` | 6.5 | Clear source separation and usable form; history/test records create visual clutter and form states need polish. |
| `/companies/[companyNumber]/report` | 6.9 | Report structure is complete and print-aware; still feels like web cards converted to a report rather than a finance-grade document. |

## C. Brand Alignment Assessment

What works:

- Warm background, ocean/navy headings and aqua primary actions match the brand system.
- Tone is calm and practical.
- The UI avoids shark gimmicks, fear-led language, fake AI claims and regulated-rating language.
- Manual data and missing data are visible.
- Score is consistently advisory and source-linked.

What is underdeveloped:

- CreditShark has no strong visual signature beyond colour and wordmark.
- The pages feel generic because most sections use the same card/badge/button treatment.
- The landing page lacks a compelling product/report preview, which is central to the brand promise.
- Dense disclaimer blocks appear too often and can make the product feel defensive.
- Risk and evidence chips need more visual differentiation.

## D. Route-by-Route Findings

### `/`

Observed:

- Clear H1: "UK company credit checks before you trade".
- One primary CTA: "Check a company".
- Basic workflow card with metrics such as Score, Sources and Scope.
- Guardrail footer visible.

Issues:

- Hero is copy-only and has no product preview or report preview.
- "MVP workflow" is implementation-led and should not appear in customer-facing UI.
- Trust/proof signals are absent.
- Secondary CTA such as "View sample report" is missing.
- Page feels like a starter template rather than a modern SME finance SaaS homepage.

### `/search`

Observed:

- Search input and submit are clear.
- Result shows company name, number, status, type, created date, location and exact match.
- Mobile stacks correctly with no horizontal overflow.

Issues:

- Text says "Select a company profile in the next build slice", which is stale implementation copy.
- Exact match is plain text rather than a strong disambiguation badge.
- Result card hierarchy is flat; company name, number and status should scan faster.
- Empty/no-result/error states need more polished, benefit-led treatment.
- Header and guardrail copy take a lot of mobile vertical space.

### `/companies/[companyNumber]`

Observed:

- Profile creates fresh snapshot and score.
- Company identity, score, risk band, confidence, limit, timestamps and top reasons are visible.
- Manual adverse and report cards link to next actions.
- Source timestamp and snapshot id are visible.

Issues:

- The first viewport still leads with company identity, while the user’s core question is the decision summary.
- Score appears in a side card on desktop and lower down on mobile; it should be the dominant first-viewport object.
- Recommended limit needs more context: basis, confidence cap and missing-data effect.
- "Report preview below" reads like a placeholder rather than a real action.
- "Each refresh creates..." copy is repetitive.
- Long IDs are visible in the profile; useful for audit but too visually dominant for primary UI.

### `/companies/[companyNumber]/score`

Observed:

- Score, confidence, recommended limit, model version, source timestamp and run timestamp are visible.
- Reason codes are grouped and source-linked.
- Missing-data flags are visible.
- Manual adverse link and report link are present.

Issues:

- Reason-code rows are visually repetitive and do not clearly separate positive, negative and missing factors.
- Source chips are useful but not yet report-grade or scan-friendly.
- Factor group headings render as lower-case labels in some contexts.
- Confidence is shown but not explained enough for a finance user.
- Top-level score card could better expose "what changed the score most".

### `/companies/[companyNumber]/adverse`

Observed:

- Companies House charges and manual data are clearly separated.
- Manual entries are labelled as user-entered and not verified registry data.
- Form labels exist and inputs are wrapped in labels.
- Re-run advisory score action is clear.

Issues:

- Superseded history can become noisy, especially with smoke-test records.
- Form is usable but plain; it needs better field grouping, help text and error display.
- Deactivate/supersede controls will need stronger confirmation patterns later.
- The page could better explain that active manual data affects only the next score run.
- Red is restrained, but material adverse severity treatment is not yet visually mature.

### `/companies/[companyNumber]/report`

Observed:

- Report includes cover, recommendation, identity, filings, charges, directors/PSC summary, reason codes, audit and limitations.
- Print CSS exists and hides app controls/navigation in print.
- No raw JSON was visible.
- Source timestamp, score run timestamp, model version and ids are visible.

Issues:

- Report title appears twice near the top, which weakens cover hierarchy.
- Report still feels like app content in a paper wrapper, not a finance-grade report.
- Tables are readable but plain.
- Disclaimers are long and repeated.
- The report export action is clear, but "Record export and print report" could be split into "Record export" and "Print / save as PDF" after state changes.
- Report id "Not recorded yet" is clear but could be styled as a neutral status.

## E. Desktop / Tablet / Mobile Findings

Desktop 1440px:

- No horizontal overflow found on audited routes.
- Layout is stable and readable.
- Desktop pages underuse available width in places; profile and score could create stronger two-column decision/evidence layouts.
- Landing page feels sparse rather than premium.

Tablet 834px:

- No horizontal overflow found.
- Breakpoint collapses profile/report grids to one column at 860px, so tablet loses desktop richness early.
- Header becomes tall, around 177px in inspected tablet/mobile layouts.
- Report tables remain readable, but report key-value grids become long.

Mobile 390px:

- No horizontal overflow found.
- Tap targets for primary actions are generally adequate.
- Header consumes significant vertical space.
- Company profile becomes very long before the user reaches all actions.
- Report tables fit without overflow but become dense and text-heavy.

## F. Top 10 Visual Issues

1. Landing page lacks a product/report preview and does not feel commercially polished.
2. Header is functional but visually basic; disabled links look unfinished.
3. Cards use similar treatment across all contexts, reducing visual hierarchy.
4. Score summary does not dominate the company profile strongly enough.
5. Recommended limit presentation needs a more finance-grade treatment.
6. Reason-code rows are useful but visually repetitive.
7. Report preview needs a stronger document identity and cover system.
8. Evidence chips are not differentiated enough by source type.
9. Guardrail/disclaimer blocks are visually heavy and repeated.
10. Mobile layouts are correct but feel long and utilitarian.

## G. Top 10 UX Clarity Issues

1. Search result copy still references a "next build slice".
2. Profile refresh creates a new snapshot, but the implications are not clearly scoped.
3. Profile does not put "Can we trade, at what limit, and why?" first enough.
4. Confidence level lacks plain-language meaning.
5. Recommended limit lacks visible basis/cap explanation.
6. Manual adverse history can clutter the current-review workflow.
7. Export flow should better distinguish preview, recorded export and browser print.
8. Report route uses latest score run; users may not realise profile visits can create newer runs.
9. Missing financial extraction is visible but needs better "what this means" explanation.
10. Disabled Watchlist/Reports nav items suggest broken or incomplete navigation.

## H. Accessibility Findings

Positive:

- Main forms inspected had labels or label wrappers.
- Button tap heights are generally around 46-48px for primary actions.
- Focus states exist on buttons and inputs.
- Heading structure is mostly logical.
- Colour contrast appears generally adequate for core text on light surfaces.

Needs work:

- Wordmark and nav tap areas are smaller than main actions on mobile.
- Some H3 group headings are lower-case and may read as raw internal labels.
- Disabled nav items are spans, not focusable; this is acceptable but could be clearer as "Coming soon" menu items or removed.
- Long IDs in visible UI may be noisy for screen-reader users unless moved to audit details.
- Print controls should have clearer state text after export is recorded.

## I. Report / Export Presentation Findings

The report is complete enough for internal MVP use. It includes the right compliance context and preserves source timestamps, snapshot id, score run id, model version and missing-data limitations.

Before paid-user or external stakeholder use, it needs:

- Stronger cover hierarchy.
- Cleaner section dividers.
- More report-specific typography.
- Better reason-code table layout.
- Less repeated disclaimer weight.
- A recorded-export status banner with export id and timestamp.
- Print QA on real PDF output, not just CSS rule presence.

## J. Mobile Findings

Mobile is robust in layout terms. No horizontal overflow was found across `/search`, profile, adverse, score or report routes at 390px.

Primary mobile issues are qualitative:

- Header height is too large.
- Long pages need better section anchors or compact summary cards.
- Profile score is pushed below identity content.
- Report preview is usable but dense.
- Adverse form is usable but would benefit from grouped fieldsets and clearer helper text.

## K. Recommended Visual Direction

Keep the current colour foundation, but make the system feel more authored:

- Introduce a stronger product shell with tighter header, clearer active nav and fewer disabled items.
- Create a first-class `DecisionSummary` pattern with score, band, limit, confidence and top reasons.
- Create a source/evidence chip system with variants for Companies House, manual data, snapshot, score run and missing data.
- Build report-specific surfaces rather than reusing generic app cards.
- Add a sample report/product preview to the public landing page.
- Use warm white whitespace and pale ocean panels more intentionally, not uniformly.
- Use risk colours only in badges, warnings and material adverse states.

## L. What Not to Change

- Do not change product logic during visual polish.
- Do not remove advisory guardrails.
- Do not hide missing data.
- Do not hide manual data labels.
- Do not introduce shark novelty branding.
- Do not add dark enterprise intelligence styling.
- Do not use consumer-credit or regulated-rating language.
- Do not add fake AI claims.
- Do not overuse red.
- Do not add external assets just to look more polished.

## M. Suggested Implementation Phases

### Phase 1: Public/Home/Search Polish

Focus on acquisition and first impression:

- Replace generic landing workflow card with product/report preview.
- Strengthen hero CTA hierarchy.
- Add trust/proof row without regulated claims.
- Improve search empty/results/no-result/error states.
- Tighten app shell/header.

### Phase 2: Company Workflow Polish

Focus on finance-user decision flow:

- Rework profile first viewport around decision summary.
- Improve score/limit/confidence cards.
- Improve reason-code grouping and source chips.
- Improve manual adverse warnings and form states.
- Improve report document styling.

### Phase 3: Commercial Polish

Focus after decision/watchlist foundations:

- Add sample report public section.
- Add pricing/trust/proof sections.
- Explore a restrained wordmark/mark system.
- Add polished watchlist/portfolio visuals.

## Suggested Next Implementation Task

Split the next work into two tasks:

- **Task 8A - Public/home/search visual polish**
- **Task 8B - Company workflow/report visual polish**

Reason: the landing/search surfaces need different layout and copy work than the dense company workflow. Combining them would create a broad, hard-to-review visual pass and increase the chance of accidental product-logic changes.
