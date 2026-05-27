# CreditShark IA Brand Alignment Addendum

Addendum date: 27 May 2026

Related documents:

- `docs/brand/creditshark-brand-system.md`
- `docs/audits/creditshark-navigation-ia-audit.md`
- `docs/audits/creditshark-simplified-ux-plan.md`

## 1. Purpose

This addendum aligns the navigation and IA simplification plan with the final CreditShark brand system.

The updated brand system is the source of truth for future UX simplification, app shell, dashboard, company workspace, score display, copy and legal wording work. The IA plan should now be interpreted through the brand line `Trade Risk. Calmly Managed.` and the core brand idea: clear credit insight for SMEs, delivered calmly.

## 2. Updated Brand Lens For IA

`Trade Risk. Calmly Managed.` should shape the product structure as much as the visual design.

The IA should:

- Reduce route and action clutter.
- Avoid corporate-heavy bureau complexity.
- Prioritise calm decision support over dense data browsing.
- Make the next commercial action obvious.
- Keep evidence depth available without overwhelming SME users.
- Keep the app practical for business owners, finance users and credit-control users.
- Present risk as something to understand and manage, not something to dramatise.

CreditShark should feel SME-first, affordable but credible, alert but not alarming, clear but not simplistic, and practical rather than theoretical.

## 3. Public Site Implications

The public homepage should eventually centre on:

- `Trade Risk. Calmly Managed.`
- Clear credit insight for SMEs.
- Understanding who you are trading with.
- Spotting risk earlier.
- Protecting cash flow.
- Making confident commercial decisions.
- One clear `Check a company` CTA.
- Footer-only legal wording.

The public site should not expose dense app workflow details or make CreditShark feel like an enterprise credit-bureau system. It should explain the value in simple SME language and show enough product/report preview to build confidence.

This addendum does not request public homepage implementation.

## 4. App Dashboard Implications

The future `/app` dashboard should express the brand through a calm SME workflow, not a dense bureau dashboard.

The dashboard should include:

- Prominent company search.
- Watchlist summary.
- Recent checks.
- Recent score movements.
- Recent decisions.
- Recent report exports.
- Clear empty states.

The dashboard should help users answer practical questions:

- Who should I check?
- Which companies need review?
- What changed recently?
- Which decision or report should I continue?
- What might affect cash flow or trade exposure?

The design should use deep navy for structure, signal teal and fresh aqua for action and active states, soft mist and clean white for calm surfaces, and controlled risk colour only where it adds decision value.

## 5. Company Workspace Implications

The company workspace should make the latest CreditShark check the first and clearest object on the page.

Above the fold, the workspace should show:

- Company name and number.
- Company status.
- Latest CreditShark check timestamp.
- Companies House source freshness or last updated timestamp.
- CreditShark Trade Risk Score.
- Risk band.
- Recommended limit.
- Confidence.
- Short `what helps` and `what needs review` summaries.
- Manual-data indicator where relevant.
- Primary actions for the next commercial step.

Evidence should move into clear tabs so the user can inspect detail without the first viewport becoming a database report. Raw ids and audit metadata should be secondary, usually in details or audit sections.

Manual data must remain clearly labelled as manual data. User-recorded decisions must remain clearly distinct from the advisory score and should never imply that CreditShark approved, declined, lent or brokered credit.

## 6. Data Visualisation Implications

Future UI work should align with the `CreditShark Trade Risk Score` concept in the brand system.

The score component should use:

- A 0-100 score.
- A simple circular gauge.
- A plain-English rating.
- A short practical interpretation.
- Source freshness or last updated timestamp.
- Calm colour use.
- Text labels in addition to colour.

The gauge should feel clear and commercially useful, not like a regulated credit rating, lending decision, or complex bureau score. Colour must never be the only carrier of meaning.

The brand system's preferred risk-label direction is:

- Low Risk
- Moderate Risk
- Elevated Risk
- High Risk

If the current scoring model or persisted data uses different band labels, a later terminology-alignment task may be required. That should be handled as a copy/model-contract alignment task, not as part of this documentation addendum. Do not change scoring logic in this task.

## 7. Legal And Copy Implications

Use one concise footer disclaimer for normal app and public surfaces:

> CreditShark provides advisory trade-risk screening for UK limited companies only. It does not provide consumer credit reports, regulated credit ratings, lending decisions, credit broking, debt advice or debt collection services.

Report-specific limitations should remain in exported reports because reports may be saved, printed or shared outside the app.

Normal app UI should use short contextual labels only:

- Advisory score
- Manual data included
- User-entered record
- User-recorded decision
- Latest CreditShark check
- Source-linked evidence

Do not repeat the full legal wording across cards, score panels, headers, summaries or routine app content. Keep legal clarification present but not heavy.

Voice should stay calm, clear, practical and commercially useful. Avoid fear-led language, consumer-credit language, regulated-rating language, shark puns, novelty phrasing and automated-decision wording.

## 8. Implementation Impact On Existing Simplification Phases

Phase 1: legal/disclaimer simplification and shared copy constants.

- Use the new approved brand wording.
- Separate global footer disclaimer from report-only limitations.
- Replace repeated full app-surface legal blocks with short contextual labels.

Phase 2: app shell and `/app` dashboard.

- Make the app shell SME-first, calm and practical.
- Keep search prominent.
- Use a lean left navigation.
- Avoid a corporate-heavy bureau dashboard feel.

Phase 3: company workspace tab navigation.

- Prioritise the CreditShark Trade Risk Score and calm evidence hierarchy.
- Put latest check, score, risk band, limit, confidence and top reasons above the fold.
- Move detailed evidence into tabs.
- Keep raw ids and audit metadata secondary.

Phase 4: recent checks/watchlist dashboard integration.

- Focus on spotting risk early, protecting cash flow and continuing recent work.
- Use watchlist and recent movement content as practical review prompts, not alarm feeds.

Phase 5: public homepage final polish.

- Fully apply `Trade Risk. Calmly Managed.`
- Centre the page on clear SME credit insight, practical risk awareness and one strong `Check a company` CTA.
- Keep the legal wording in the footer only unless a separate legal/report context requires more.

## 9. What Not To Change

Do not change scoring logic yet.

Do not change database schema.

Do not implement the Calm Fin logo in code yet unless separately tasked.

Do not add chart libraries yet.

Do not rename risk bands in the database yet.

Do not alter route behaviour.

Do not introduce regulated-rating language.

Do not weaken the advisory decision-support guardrails.

## 10. Recommended Next Implementation Task

Recommended next task: **Task 12A - Legal/disclaimer simplification and shared copy constants**.

Why this should come next:

- It is low risk because it is primarily copy and shared-constant cleanup.
- It reduces clutter immediately.
- It aligns the app with the final brand system.
- It prepares the app for the `/app` dashboard and company workspace shell.
- It preserves the important legal boundary while making normal product surfaces calmer and easier to scan.

Task 12A should not change scoring, database schema, route behaviour, Vercel settings or report-export logic. It should keep report-only limitations intact and retain short labels for advisory scores, manual data, user-recorded decisions, latest checks and source-linked evidence.
