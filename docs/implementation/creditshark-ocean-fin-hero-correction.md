# CreditShark Ocean Fin Hero Correction

## What was wrong with the previous motif approach

The previous Calm Fin public styling used an abstract inline motif and kept the homepage hero focused on a product-preview card. That did not match the intended public brand direction: a calm ocean landscape with a single fin emerging from the water, fading from right to left so the left-side copy stays clean and readable.

## Asset created

Created:

- `public/images/brand/creditshark-ocean-fin-hero.svg`

The asset is a custom SVG scene with:

- Wide `1600x900` landscape viewBox.
- Calm sky and ocean gradients.
- Horizon and layered water shapes.
- Subtle wave highlights and ripples.
- One dark navy fin on the right-middle of the scene.
- Left-side fade using an internal mask.
- No text, scripts, external references or remote image dependencies.

## Why SVG was chosen

SVG was chosen because it keeps the asset local, lightweight, responsive and brand-controlled without adding raster image generation, stock imagery, external URLs or heavy image tooling. It also allows the left fade, ocean gradients and wave layers to remain crisp across desktop and mobile viewports.

## Homepage implementation

The homepage hero now uses the ocean-fin asset as the right-side scene treatment via the shared `CalmFinHero` component.

The first correction still treated the ocean scene as a standalone boxed visual card and removed the CreditShark trade-risk preview. This pass changes the ocean-fin SVG into an ambient background layer and restores the product/trade-risk preview as foreground content.

The background image now sits mainly on the right side of the hero and fades toward the left. The foreground keeps the CreditShark message:

- `Trade Risk. Calmly Managed.`
- `Clear credit insight for SMEs before you trade`
- Source-linked UK limited-company checks
- Primary CTA: `Check a company`

The restored preview shows advisory score, recommended limit, confidence, source-linked evidence, manual-data labelling, user-recorded decision and report preview concepts. The ocean/fin image is a homepage background treatment, not a logo or standalone product component.

## `/brand` implementation

The `/brand` page reuses the same ocean-fin asset in the hero as a subtler reference-page accent. The brand page still keeps all guidance sections intact and keeps the Calm Fin explanation in adjacent text.

## Accessibility and performance notes

- The asset is decorative.
- The rendered image uses empty alt text and `aria-hidden`.
- No screen-reader noise is added.
- No layout shift from remote image loading.
- No remote network calls.
- No external stock imagery.
- The asset is a static local SVG.
- Responsive CSS keeps text readable and prevents horizontal overflow.

## Browser checks

Browser checks should cover:

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

- Homepage shows a calm ocean landscape with a single fin.
- Image fades left and copy remains readable.
- `/brand` uses the asset more subtly.
- No horizontal overflow.
- No console errors.
- Footer disclaimer appears once on normal routes.
- App/platform/company routes still render normally.
- No false auth, pricing, monitoring or regulated-rating claims.

## Known limitations

- The SVG is a custom brand hero illustration, not a final approved logo asset.
- The existing Calm Fin concept illustration remains in the `/brand` logo section and is still labelled as concept artwork.
- The homepage still uses the existing public layout and global CSS compatibility layer.

## What was deliberately not changed

- Scoring logic.
- Snapshot creation behaviour.
- Companies House API behaviour.
- Database schema.
- Report export, manual adverse, decision or watchlist persistence.
- App route behaviour.
- Vercel settings.
- Tailwind preflight.
- Auth, pricing, sample-report or other product routes.
