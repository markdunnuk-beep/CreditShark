# CreditShark Scoring Model v1

## 1. Model Objective

CreditShark v1 uses a deterministic rule-based score to support UK limited-company trade-risk decisions. The model is designed for explainability, auditability, and manual review. It is not a consumer credit score, not a regulated credit rating, and not an automated lending decision.

## 2. Score Output

Each score run produces:

- `score`: integer from 0 to 100.
- `riskBand`: risk band derived from score and hard-stop rules.
- `recommendedCreditLimit`: amount and currency.
- `confidenceLevel`: high, medium, low, or insufficient.
- `modelVersion`: published scoring model version.
- `reasonCodes`: ordered list of score drivers.
- `missingDataFlags`: material missing or low-confidence inputs.
- `manualOverrideState`: none, manual_data_present, overridden, or review_required.
- `snapshotId`: company snapshot scored.
- `runAt`: timestamp.

## 3. Risk Bands

| Band | Score range | Default interpretation |
|---|---:|---|
| Very low risk | 81-100 | Standard approval may be appropriate within recommended limit |
| Low risk | 61-80 | Approval may be appropriate with light review |
| Moderate risk | 41-60 | Refer for review before extending material credit |
| High risk | 21-40 | Restrict exposure or require senior approval |
| Very high risk | 1-20 | Prepayment, reject, or exceptional approval only |
| Not scored | n/a | Manual review required |

Hard-stop conditions may force `Not scored`, `High risk`, or `Very high risk` even when numeric inputs would otherwise score higher.

## 4. Factor Groups

The v1 score starts from a neutral baseline and applies bounded adjustments by factor group. Exact weights should be stored in `scoring_model_versions` and reason-code output.

### Company Status

Purpose: Prevent normal recommendations for companies whose legal status makes standard trade credit inappropriate.

Signals:

- Active status.
- Dissolved status.
- Liquidation, administration, receivership, strike-off, or insolvency indicators where available.
- Dormant status where available.

Treatment:

- Active status can be positive.
- Dissolved or insolvency status should force `Very high risk` or `Not scored`.
- Strike-off or liquidation signals should require manual review.

### Company Age

Purpose: Reflect uncertainty for newly incorporated companies.

Signals:

- Incorporation date.
- Trading age bands.

Treatment:

- Established age is positive.
- Newly incorporated companies have lower confidence and conservative limit caps.
- Very new companies with no accounts may be scored but should usually require review for material exposure.

### Filing Behaviour

Purpose: Assess statutory compliance and data freshness.

Signals:

- Latest accounts date.
- Accounts due/overdue status.
- Confirmation statement due/overdue status.
- Filing recency.
- Repeated lateness if derivable.
- Accounts type and available detail.

Treatment:

- Current filings are positive.
- Overdue accounts or confirmation statements are negative.
- Missing or limited accounts detail reduces confidence.

### Financial Strength

Purpose: Use available accounts evidence to assess scale and resilience.

Signals:

- Net assets/shareholder funds where available.
- Turnover where available.
- Profit/loss trend where available.
- Cash/liabilities where available.
- Accounts type: full, small, micro, dormant, abridged, unaudited.

Treatment:

- Strong net assets and stable profitability are positive.
- Losses, negative net assets, or deteriorating trends are negative.
- Micro/dormant/limited filings should reduce confidence rather than invent precision.

### Charges

Purpose: Reflect secured borrowing and encumbrance signals.

Signals:

- Active charges count.
- Recently created charges.
- Satisfied charges.
- Charge density relative to company age.

Treatment:

- Active and recent charges are risk factors.
- Satisfied charges are lower impact.
- Charges should be explained as context, not automatic failure.

### Manual CCJ and Adverse Events

Purpose: Include trusted non-Companies-House adverse information entered by authorised users.

Signals:

- Manual CCJ.
- Manual insolvency/adverse note.
- Event amount.
- Event date.
- Event status: judgment, satisfied, disputed, paid, unknown.
- Source note and evidence reference.

Treatment:

- Recent unsatisfied material events are high-impact negatives.
- Satisfied/old events are lower impact but still visible.
- Manual events must always be labelled as manual data.
- Manual adverse events can force review.

### Director/PSC Signals v1

Purpose: Provide light-touch company governance context.

Signals:

- Officer count.
- Recent officer appointments/resignations.
- Officer churn.
- PSC availability.

Treatment:

- Use low weighting in v1.
- Do not infer personal creditworthiness.
- Do not add consumer-credit or AML-style conclusions.
- Promote to reason codes only when the signal is material and explainable.

### SIC/Sector Weighting

Purpose: Add a small configurable sector adjustment.

Signals:

- Primary SIC code.
- Configured SIC risk weight.
- Sector classification.

Treatment:

- Low-impact adjustment only.
- Must be visible as a reason code.
- Should not dominate statutory and adverse evidence.

### Data Completeness

Purpose: Communicate confidence and prevent false precision.

Signals:

- Missing accounts data.
- Missing filings.
- Limited accounts type.
- Stale snapshot.
- Failed API sections.
- Manual data without evidence reference.

Treatment:

- Reduces confidence.
- May cap recommended limit.
- Can force manual review.

## 5. Confidence Level

| Confidence | Meaning |
|---|---|
| High | Current Companies House snapshot, meaningful filings/accounts, no material missing sections |
| Medium | Some limited data or older filings, but enough evidence for advisory screening |
| Low | Newly incorporated, limited accounts, stale data, or material missing sections |
| Insufficient | Hard-stop status or missing critical data; manual review required |

## 6. Recommended Credit Limit

The recommended limit is a derived advisory amount. It must be shown with its basis and limitations.

Inputs:

- Score and risk band.
- Confidence level.
- Company age.
- Financial scale where available.
- Net assets/shareholder funds where available.
- Filing behaviour.
- Active charges.
- Manual adverse events.
- Requested credit limit if supplied.
- Manual override if approved.

Rules:

- No standard limit for dissolved or insolvent companies.
- Cap limits for newly incorporated companies with no accounts.
- Cap or reduce limits where confidence is low.
- Reduce limit for overdue filings, active/recent charges, and manual adverse events.
- Allow manual override only with reason, user, timestamp, and audit record.

## 7. Reason Code Structure

Each reason code must include:

| Field | Description |
|---|---|
| `code` | Stable machine-readable identifier |
| `label` | Short user-facing label |
| `group` | Factor group |
| `direction` | positive, negative, neutral, or missing |
| `weight` | Numeric model impact for this score run |
| `impact` | low, medium, high, material, or hard_stop |
| `sourceType` | companies_house_profile, filing, charge, officer, psc, manual_adverse_event, scoring_model, snapshot |
| `sourceId` | Source record identifier where available |
| `sourceDate` | Date of source evidence or input |
| `explanation` | Plain-English explanation |

Example:

```json
{
  "code": "ACCOUNTS_OVERDUE",
  "label": "Accounts overdue",
  "group": "filing_behaviour",
  "direction": "negative",
  "weight": -12,
  "impact": "material",
  "sourceType": "companies_house_filing",
  "sourceId": "filing_2026_accounts_due",
  "sourceDate": "2026-05-26",
  "explanation": "The latest accounts appear overdue, reducing confidence in the company's current financial position."
}
```

## 8. Manual Override State

| State | Meaning |
|---|---|
| `none` | No manual events or overrides affect the recommendation |
| `manual_data_present` | Manual adverse data is included in the score |
| `overridden` | A user changed the recommended limit or decision |
| `review_required` | The score cannot safely produce a normal recommendation |

## 9. Versioning and Audit

- Every published model has a version, effective date, author, and change note.
- Every score run stores model version, input snapshot, reason codes, and output.
- Changing a model must not mutate historical score runs.
- Re-running a score creates a new score run.
- Exported reports reference the exact score run and snapshot.

