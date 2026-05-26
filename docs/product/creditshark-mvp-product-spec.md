# CreditShark MVP Product Specification

## 1. Product Positioning

CreditShark is a UK limited-company credit screening web app for B2B trade-risk decision support. It helps a business review whether to trade with a UK limited company, what exposure level may be appropriate, and which evidence supports that recommendation.

The MVP uses:

- Companies House data as the primary evidence source.
- Manual CCJ and adverse-event input where trusted users have additional information.
- A transparent deterministic scoring model, not a black-box model.
- Exportable credit-screening reports with source timestamps and audit trail.
- Manual review and decision recording.

CreditShark is not:

- A consumer credit reporting product.
- A sole trader credit report product.
- An FCA-regulated credit rating.
- A lending platform.
- A credit broker.
- A debt-advice or debt-collection service.
- A substitute for legal, financial, or underwriting judgement.

The product score is advisory. Final trading decisions remain with the user or business policy owner.

## 2. MVP User Journey

1. User searches for a UK limited company by company number or company name.
2. User selects the correct company from disambiguated results.
3. CreditShark pulls Companies House profile, filing, charges, officers, and PSC data.
4. CreditShark creates a company snapshot with source timestamps.
5. User runs the current published scoring model.
6. CreditShark produces score, risk band, confidence level, recommended credit limit, reason codes, missing-data flags, and manual override state.
7. User reviews the score explanation and source evidence.
8. User adds manual CCJ or adverse-event information if required.
9. User re-runs the score if manual adverse data changes the input picture.
10. User records an approve, refer, or reject decision, with requested limit, recommended limit, and reviewer notes.
11. User exports a PDF report for internal evidence.
12. User optionally adds the company to a watchlist for change monitoring.

## 3. MVP Scope

### In Scope

- UK limited company search and profile review.
- Companies House data ingestion.
- Company snapshots.
- Deterministic scoring model v1.
- Transparent score explanation.
- Filing behaviour assessment.
- Charges assessment.
- Basic financial/accounts summary.
- Current officers and PSC summary.
- Manual CCJ/adverse-event input.
- Decision recording.
- PDF report export.
- Watchlist flag.
- Audit trail for key actions.

### Out of Scope for MVP

- Consumer checks.
- Sole trader credit checks.
- AML/KYC screening.
- Debt collection.
- Credit broking.
- Lending application processing.
- Trade-payment behaviour unless an internal trusted data source is integrated later.
- International score.
- Complex group graph.
- AI-generated credit recommendations without deterministic rule evidence.

## 4. Core Product Principles

- Evidence first: every recommendation must link back to source data or manual input.
- Explainability first: users must understand why the score changed.
- Manual review supported: the app recommends; it does not force an automated decision.
- Data limitations visible: missing accounts detail, manual CCJ coverage, and source age must be visible.
- Versioned decisions: every score run and exported report must record model version and input snapshot.
- UK limited companies only for v1.

## 5. Primary Objects

- Company: durable identity keyed by Companies House number.
- Snapshot: point-in-time pull of source data and derived facts.
- Score run: point-in-time scoring output for one snapshot and model version.
- Reason code: one scoring explanation item tied to a source.
- Manual adverse event: user-entered adverse/legal/payment-risk evidence.
- Credit recommendation: recommended limit and band produced by a score run.
- Decision record: user action to approve, refer, or reject.
- Watchlist item: company selected for ongoing monitoring.
- Report export: generated PDF record tied to snapshot and score run.
- Audit event: immutable record of important user/system actions.

## 6. Credit Recommendation Surface

The company profile first viewport should answer:

- What company is this?
- Is it active and eligible for a standard trade review?
- What is the current risk band?
- What credit limit is recommended?
- How confident is CreditShark in the recommendation?
- What are the top positive and negative reasons?
- What data is missing or manually entered?
- What should the user do next: approve, refer, reject, add manual evidence, refresh, export, or watch?

## 7. Compliance and Risk Guardrails

- Limit checks to UK limited companies and related registered entities available through Companies House.
- Do not present consumer credit checks or consumer affordability checks.
- Do not produce sole trader credit reports.
- Do not describe the product as an FCA-regulated credit rating.
- Do not make lending decisions, broker credit, or provide debt advice.
- Label the score as advisory decision support.
- Require manual review for not-scored, dissolved, insolvent, newly incorporated, materially incomplete, or manually overridden cases.
- Show source timestamps for Companies House data and manual entries.
- Show manual adverse events as manual data, including user and timestamp.
- Show data limitations in the UI and exported report.

## 8. MVP Success Criteria

- A user can find and identify a UK limited company.
- A user can generate a source-timestamped company snapshot.
- A user can run a deterministic score and see reason codes.
- A user can add manual adverse events and see them affect the score.
- A user can record approve, refer, or reject with rationale.
- A user can export a PDF report with score, limit, reasons, evidence, timestamps, and limitations.
- All material actions are audit logged.

