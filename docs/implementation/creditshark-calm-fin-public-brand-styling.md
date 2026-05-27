# CreditShark Calm Fin Public Brand Styling

## What was built

Task 12J applied a Calm Fin / ocean visual treatment to the public homepage and `/brand` page. The work is limited to public brand styling and does not change product workflows, scoring, persistence, routes, Vercel configuration or Tailwind preflight.

## Calm Fin / ocean motif approach

The motif is implemented as a lightweight React/CSS/SVG component:

- `app/components/brand/calm-fin-hero.tsx`

The component uses inline SVG waves, a calm fin shape, soft aqua/navy gradients and a left-to-right fade. It does not load external images, make network calls or embed text inside the graphic.

The SVG is decorative and uses `aria-hidden` / presentation semantics so it does not add screen-reader noise. On `/brand`, nearby copy explains the Calm Fin idea.

No final logo asset was created. The motif is a brand surface treatment, not an approved production logo file.

## Homepage application

The homepage hero now puts the brand promise first:

- `Trade Risk. Calmly Managed.`
- `Clear credit insight for SMEs before you trade`
- Source-linked UK limited-company checks
- Primary CTA: `Check a company`

The right side uses the ocean/fin hero motif with the existing conceptual CreditShark product preview layered over it. The preview keeps advisory score, limit, confidence and source-linked evidence language without implying regulated ratings or lending decisions.

## `/brand` application

The `/brand` hero now uses the same visual language in a quieter reference-page treatment:

- `Brand system v1.0`
- `CreditShark`
- `Trade Risk. Calmly Managed.`
- Calm Fin explanation in nearby text
- Calm Fin motif panel with brand attributes

The rest of the brand guide content remains intact.

## Public header/footer handling

The public header and footer received a subtle ocean/mist treatment while staying lean:

- Public nav remains `Dashboard`, `Search`, `Brand`, `Watchlist`.
- `/brand` is public-context navigation only, not part of the platform sidebar.
- Footer disclaimer remains handled globally and stays visually quiet.

## Accessibility and performance notes

- No external stock imagery or remote assets.
- No layout shift from late-loading images.
- SVG is lightweight and rendered inline.
- Decorative motif avoids screen-reader noise.
- Hero text remains outside the SVG with normal accessible text.
- Responsive rules keep the graphic and overlaid cards inside the viewport at mobile widths.

## What was deliberately not changed

- Scoring logic or score weights.
- Snapshot creation behaviour.
- Companies House API behaviour.
- Database schema.
- Report export, manual adverse, decision or watchlist persistence.
- Route URLs.
- Vercel settings.
- Tailwind preflight.
- Auth, pricing, sample-report or other new public routes.
- Final logo/final favicon assets.

## Browser checks

Browser checks performed for this task covered:

- `/`
- `/brand`
- `/app`
- `/search`
- `/watchlist`
- `/companies/00445790`

At:

- Desktop `1440px`
- Tablet `834px`
- Mobile `390px`

Checks:

- Homepage hero graphic is visible, calm and non-aggressive.
- Homepage text remains readable.
- `/brand` hero motif is visible but not overpowering.
- `/brand` content remains readable.
- No horizontal overflow.
- No console errors.
- Footer disclaimer appears once on normal routes.
- App/platform routes still render correctly.
- Company route still renders correctly.
- No false auth, monitoring or pricing claims.

The watchlist page still includes the existing clarification that it is not continuous monitoring yet. This task did not alter that copy or add monitoring claims.

## Known limitations

- The Calm Fin treatment is a motif, not a final logo asset.
- The homepage product preview remains conceptual and does not create a sample-report route.
- Some legacy global CSS remains for compatibility with existing app and report surfaces.

## Next task recommendation

Continue with a small visual QA pass after this motif lands, focused on public mobile spacing and any remaining legacy CSS that can be safely reduced without changing product behavior.
