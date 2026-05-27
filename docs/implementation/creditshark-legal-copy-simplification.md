# CreditShark Legal Copy Simplification

Implementation date: 27 May 2026

## What Changed

Task 12A simplified repeated legal/compliance copy across normal CreditShark app and public surfaces.

The previous long product guardrail copy was replaced with shared constants for:

- Global footer disclaimer.
- Report-only limitations.
- Short contextual app labels.

Normal app pages now use concise labels and short practical notes instead of repeating full legal blocks in cards, panels and page summaries.

## Footer Disclaimer Standard

Normal public and app surfaces use one concise global footer disclaimer:

> CreditShark provides advisory trade-risk screening for UK limited companies only. It does not provide consumer credit reports, regulated credit ratings, lending decisions, credit broking, debt advice or debt collection services.

The footer uses `CREDITSHARK_FOOTER_DISCLAIMER` from `src/lib/guardrails.ts`.

## Report-Only Limitations Handling

Exportable report content retains standalone limitations because reports may be saved, printed or shared outside the app.

Report limitations use `CREDITSHARK_REPORT_LIMITATIONS` from `src/lib/guardrails.ts` and remain in the report document's `Audit and limitations` section.

The report still shows:

- Source timestamps.
- Model version.
- Snapshot id.
- Score run id.
- Export record state.
- Manual-data labels.
- Missing-data limitations.
- User-recorded decision context.

The same full report limitation is not repeated across multiple report sections.

## Contextual Labels Used

Shared labels added in `src/lib/guardrails.ts`:

- `ADVISORY_SCORE_LABEL`
- `LATEST_CHECK_LABEL`
- `MANUAL_DATA_INCLUDED_LABEL`
- `USER_ENTERED_RECORD_LABEL`
- `USER_RECORDED_DECISION_LABEL`
- `SOURCE_LINKED_EVIDENCE_LABEL`
- `COMPANIES_HOUSE_EVIDENCE_LABEL`
- `SCORE_HISTORY_LABEL`

Short contextual notes remain where they help users understand:

- Manual entries are shown separately from Companies House evidence.
- The user records any commercial decision.
- Scores and limits are advisory indicators.
- Historical rows are previous CreditShark checks, not the current risk view.

## Routes Touched

- `/`
- `/search`
- `/watchlist`
- `/companies/[companyNumber]`
- `/companies/[companyNumber]/score`
- `/companies/[companyNumber]/adverse`
- `/companies/[companyNumber]/decision`
- `/companies/[companyNumber]/history`
- `/companies/[companyNumber]/report`

## Deliberately Not Changed

- Scoring logic.
- Snapshot creation logic.
- Companies House API behaviour.
- Database schema.
- Route structure.
- Report export persistence.
- Manual adverse persistence.
- Decision persistence.
- Watchlist persistence.
- Vercel settings.
- Risk-band terminology or scoring-model labels.
- Calm Fin logo implementation.
- Chart or gauge libraries.

## Validation Performed

Required validation:

- `npm run lint`
- `npm run test`
- `npm run build`

Browser checks should confirm:

- Normal pages show the concise footer disclaimer only.
- Long legal blocks no longer appear in normal app cards or page panels.
- Report preview still includes standalone limitations.
- Manual data remains labelled.
- User-recorded decisions remain labelled.
- Advisory score context remains clear.
- No horizontal overflow or console errors are introduced.

## Next Task Recommendation

Recommended next task: app shell and `/app` dashboard implementation.

Reason: legal-copy clutter has been reduced, so the app is better prepared for the simplified navigation model, a calm SME dashboard and a company workspace shell.
