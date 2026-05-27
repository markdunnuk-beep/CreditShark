# CreditShark Live Check and Score History

## What Was Built

This slice makes the current profile explicitly read as the latest CreditShark check and adds score history for previous advisory score runs.

Added:

- Server-side score history service.
- `/companies/[companyNumber]/history` route.
- Latest-versus-previous movement calculation.
- Compact score-history summaries on profile, score explanation and report preview.
- Lightweight SVG trend line on the history page.
- Score-history smoke script.
- Unit tests for movement, row summaries, decision/report flags and safe history output.

No monitoring, watchlist, external adverse-data integration, chart library, auth or scoring-model configuration was added.

## Live-Check Principle

Opening a company profile remains the live check workflow:

1. Fetch Companies House data.
2. Create a fresh source snapshot.
3. Run advisory scoring.
4. Present that result as the latest CreditShark check.

The user is not asked to decide whether to refresh during ordinary use. Historical score runs are labelled as history, not current risk.

No stale-cache model was introduced. No anti-duplicate reuse window was added in this slice.

## Score History Model

The history service loads recent `score_runs` for a company, newest first, and enriches each row with:

- linked snapshot timestamp;
- scoring model version;
- credit recommendation;
- top positive reason;
- top review/missing reason;
- missing-data flags;
- linked decision summary, if present;
- report export count/latest export, if present.

Raw JSON is not returned or rendered.

## Route Behaviour

`/companies/[companyNumber]/history` shows:

- company header;
- latest check summary;
- score movement summary;
- recent trend line;
- historical score-run table;
- links back to profile, latest score, report and decision surfaces.

The page can require `DATABASE_URL` at runtime. Build does not require database access or Companies House access.

## Movement Calculation

Movement compares the latest score run to the previous score run:

- increase: latest score is higher;
- decrease: latest score is lower;
- unchanged: score is the same;
- none: zero or one scored row is available.

Risk-band movement is reported separately when the band changes.

## Database Tables Used

- `companies`
- `score_runs`
- `company_snapshots`
- `scoring_model_versions`
- `credit_recommendations`
- `score_reason_codes`
- `decision_records`
- `report_exports`

No schema migration was added.

## Future Monitoring Compatibility

The history wording and service shape leave room for future source-event summaries from:

- new Companies House accounts;
- new filing history records;
- charge creation or satisfaction;
- officer or PSC changes;
- manual adverse event additions;
- future licensed adverse/CCJ data.

This slice does not invent source events that are not stored yet.

## Smoke Test Usage

```powershell
npm run smoke:score-history -- 00445790
```

The script ensures there is at least one score run, loads score history and prints a non-sensitive summary with latest score, previous score, movement, latest risk band and latest recommended limit.

## Known Limitations

- Profile views still create fresh snapshots and score runs on each load during MVP.
- No anti-duplicate refresh window is implemented yet.
- History links point to the latest score/report/decision routes; dedicated historical score-run detail pages are not implemented.
- Source-event explanations are placeholders until monitoring/source-diff data exists.
- No charting library is used; the trend is a simple SVG line.

## Next Task Recommendation

Add score-run detail URLs or route parameters so each history row can open the exact historical score explanation and report context for that run.
