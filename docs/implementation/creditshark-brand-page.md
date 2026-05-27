# CreditShark Brand Page

## What was built

Task 12I added a public `/brand` route as the live visual reference for the CreditShark brand system. The page is static, server-rendered and does not depend on `DATABASE_URL`, Companies House, scoring, snapshots or persisted product data.

The page uses `docs/brand/creditshark-brand-system.md` as its source of truth and demonstrates how the brand should guide future public, platform, company workspace and report work.

## Page sections

- Hero / overview with CreditShark, `Trade Risk. Calmly Managed.`, the short SME synopsis and Calm Fin concept summary.
- Brand principles: calm, clear, practical, alert, SME-first and affordable.
- Logo and Calm Fin direction, including clear-space, minimum-size and avoid guidance.
- Colour system with primary swatches and controlled functional risk colour examples.
- Typography examples using the current Inter-first app font stack.
- Voice and tone examples, including preferred and avoided wording.
- Component examples using existing CreditShark UI primitives.
- Company reports and risk results structure with advisory wording.
- Layout and spacing guidance.
- Motion and iconography guidance.
- Data visualisation guidance for the CreditShark Trade Risk Score.
- Trust, compliance and boundaries with the approved legal wording.
- Production checklist for future design and copy work.

## Brand system source

The page follows the canonical brand document:

- `docs/brand/creditshark-brand-system.md`

It preserves the brand direction:

- SME-first, not corporate-heavy.
- Affordable, not cheap.
- Alert, not alarming.
- Clear, not simplistic.
- Practical, not theoretical.
- No shark puns, novelty language, consumer-credit wording or regulated-rating claims.

## Calm Fin handling

No final logo asset was added. The `/brand` page includes a simple inline SVG labelled `Concept illustration - not final logo artwork`.

This is deliberately a reference illustration only. It should not be treated as the production logo or favicon source unless a later brand asset task explicitly approves it.

## Data visualisation examples

The page uses the existing `TradeRiskScoreGauge` primitive to show the CreditShark Trade Risk Score concept:

- 0-100 score.
- Plain-English risk label.
- Short interpretation.
- Last updated/source freshness text.
- Preferred brand guidance bands:
  - 80-100 Low Risk
  - 60-79 Moderate Risk
  - 40-59 Elevated Risk
  - 0-39 High Risk

This is brand guidance only. It does not change scoring logic, persisted risk labels or model outputs.

## What was deliberately not changed

- No scoring logic changes.
- No snapshot or Companies House behaviour changes.
- No database schema changes.
- No report export, manual adverse, decision or watchlist persistence changes.
- No Vercel configuration changes.
- No Tailwind preflight changes.
- No external assets, screenshots, charting libraries or UI kits.
- No new pricing, sample-report, auth or product workflow routes.

## Browser checks

Browser checks performed for this task:

- `/brand`
- `/`
- `/app`
- `/search`
- `/companies/00445790`

At:

- Desktop `1440px`
- Tablet `834px`
- Mobile `390px`

Checks:

- `/brand` renders cleanly.
- No horizontal overflow.
- No console errors.
- Public, platform and company routes still render normally.
- The legal wording appears in the brand reference section and the global footer remains present.
- Avoid-list terms only appear as explicit brand guidance about what not to say.

The mobile check initially identified overflow in the brand page hero/data-visualisation area. The brand-page responsive CSS was tightened so wide examples stay inside their wrappers and the page no longer creates horizontal overflow at `390px`.

## Known limitations

- The Calm Fin visual is a concept illustration only.
- The score bands shown are brand guidance only and do not yet enforce terminology alignment with persisted scoring labels.
- The page is a design reference, not a complete asset-management or logo-download system.

## Next task recommendation

Task 12J should continue incremental design-system rollout by aligning remaining legacy public/app CSS surfaces with the established primitives, while leaving product logic and route behaviour unchanged.
