# CreditShark Data Model v1

## Overview

The v1 data model is designed around point-in-time evidence. Companies House data can change, manual adverse events can be added, and scoring models can evolve. CreditShark therefore stores durable company identity separately from snapshots, score runs, decisions, exports, and audit events.

## Tables

### `companies`

Purpose: Durable company identity keyed by Companies House number.

Key fields:

- `id`
- `company_number`
- `company_name`
- `company_status`
- `company_type`
- `jurisdiction`
- `registered_office_postcode`
- `incorporated_on`
- `dissolved_on`
- `created_at`
- `updated_at`

Relationships:

- Has many `company_snapshots`.
- Has many `manual_adverse_events`.
- Has many `watchlists`.

Audit considerations:

- Keep identity updates traceable through snapshots and audit events.
- Do not overwrite historical snapshot values.

### `company_snapshots`

Purpose: Point-in-time source pull and derived company facts.

Key fields:

- `id`
- `company_id`
- `company_number`
- `source`
- `source_fetched_at`
- `raw_profile_json`
- `derived_status`
- `derived_company_age_months`
- `latest_accounts_date`
- `latest_confirmation_statement_date`
- `snapshot_status`
- `created_by`
- `created_at`

Relationships:

- Belongs to `companies`.
- Has many filings, accounts, charges, officers, PSCs.
- Has many `score_runs`.

Audit considerations:

- Immutable after creation except processing status metadata.
- Store source timestamps and fetch outcome.

### `company_filings`

Purpose: Filing-history records tied to a snapshot.

Key fields:

- `id`
- `snapshot_id`
- `company_id`
- `filing_type`
- `description`
- `filing_date`
- `made_up_date`
- `category`
- `barcode`
- `source_url`
- `raw_json`
- `created_at`

Relationships:

- Belongs to `company_snapshots`.
- Can be referenced by score reason codes.

Audit considerations:

- Preserve original filing metadata.
- Do not infer lateness without storing the derived rule output in reason codes or snapshot-derived fields.

### `company_accounts`

Purpose: Accounts metadata and extracted financial facts.

Key fields:

- `id`
- `snapshot_id`
- `company_id`
- `period_start`
- `period_end`
- `accounts_type`
- `currency`
- `turnover`
- `profit_before_tax`
- `profit_after_tax`
- `net_assets`
- `cash`
- `total_liabilities`
- `employees`
- `is_consolidated`
- `extraction_method`
- `source_filing_id`
- `raw_json`
- `created_at`

Relationships:

- Belongs to `company_snapshots`.
- May reference `company_filings`.
- Can be referenced by score reason codes.

Audit considerations:

- Mark extracted, manual, unavailable, or not-applicable values.
- Store extraction method and source filing.

### `company_charges`

Purpose: Charges registered against the company.

Key fields:

- `id`
- `snapshot_id`
- `company_id`
- `charge_number`
- `status`
- `created_on`
- `delivered_on`
- `satisfied_on`
- `persons_entitled`
- `classification`
- `source_url`
- `raw_json`
- `created_at`

Relationships:

- Belongs to `company_snapshots`.
- Can be referenced by score reason codes.

Audit considerations:

- Preserve active/satisfied state at snapshot time.
- Treat charge changes as monitoring events for watched companies.

### `company_officers`

Purpose: Current and former officer records from source data.

Key fields:

- `id`
- `snapshot_id`
- `company_id`
- `officer_name`
- `officer_role`
- `appointed_on`
- `resigned_on`
- `nationality`
- `occupation`
- `country_of_residence`
- `date_of_birth_partial`
- `source_id`
- `raw_json`
- `created_at`

Relationships:

- Belongs to `company_snapshots`.
- Can be referenced by low-weight director/PSC reason codes.

Audit considerations:

- Store only source-provided officer data.
- Do not infer consumer creditworthiness.

### `company_pscs`

Purpose: Persons with significant control records.

Key fields:

- `id`
- `snapshot_id`
- `company_id`
- `psc_name`
- `psc_kind`
- `notified_on`
- `ceased_on`
- `natures_of_control`
- `country_of_residence`
- `source_id`
- `raw_json`
- `created_at`

Relationships:

- Belongs to `company_snapshots`.
- Can be referenced by governance reason codes.

Audit considerations:

- Preserve ceased/current state at snapshot time.
- Avoid personal risk conclusions beyond company-control context.

### `manual_adverse_events`

Purpose: User-entered CCJ and adverse-event evidence not supplied by Companies House.

Key fields:

- `id`
- `company_id`
- `event_type`
- `event_date`
- `amount`
- `currency`
- `status`
- `source_note`
- `evidence_reference`
- `entered_by`
- `entered_at`
- `updated_by`
- `updated_at`
- `superseded_by_id`
- `is_active`

Relationships:

- Belongs to `companies`.
- Can be included in `score_runs`.
- Can be referenced by `score_reason_codes`.

Audit considerations:

- Never silently delete; supersede or deactivate with reason.
- Manual entries must be labelled in UI and exports.

### `score_runs`

Purpose: Point-in-time scoring output for a company snapshot.

Key fields:

- `id`
- `company_id`
- `snapshot_id`
- `model_version_id`
- `score`
- `risk_band`
- `confidence_level`
- `recommended_limit`
- `currency`
- `manual_override_state`
- `missing_data_flags_json`
- `input_summary_json`
- `run_by`
- `run_at`

Relationships:

- Belongs to `companies`.
- Belongs to `company_snapshots`.
- Belongs to `scoring_model_versions`.
- Has many `score_reason_codes`.
- Has one or many `credit_recommendations`.

Audit considerations:

- Immutable after creation.
- Re-runs create new rows.

### `score_reason_codes`

Purpose: Explain score drivers and source evidence.

Key fields:

- `id`
- `score_run_id`
- `code`
- `label`
- `group`
- `direction`
- `weight`
- `impact`
- `source_type`
- `source_id`
- `source_date`
- `explanation`
- `sort_order`
- `created_at`

Relationships:

- Belongs to `score_runs`.
- May reference source records by `source_type` and `source_id`.

Audit considerations:

- Store generated explanation at score-run time.
- Do not regenerate historical reason wording without a new score run.

### `credit_recommendations`

Purpose: Store recommendation output and any requested-limit comparison.

Key fields:

- `id`
- `company_id`
- `score_run_id`
- `recommended_limit`
- `requested_limit`
- `currency`
- `basis`
- `limit_cap_reason`
- `created_at`

Relationships:

- Belongs to `score_runs`.
- Can be referenced by `decision_records`.

Audit considerations:

- Preserve recommendation basis and cap reason.
- Keep separate from final user decision.

### `decision_records`

Purpose: User-recorded approve/refer/reject decision.

Key fields:

- `id`
- `company_id`
- `score_run_id`
- `credit_recommendation_id`
- `decision`
- `approved_limit`
- `requested_limit`
- `currency`
- `reviewer_notes`
- `override_reason`
- `decided_by`
- `decided_at`

Relationships:

- Belongs to `companies`.
- Belongs to `score_runs`.
- May reference `credit_recommendations`.

Audit considerations:

- Immutable after finalisation; corrections should create a new decision or audit event.
- Require reason for overrides.

### `watchlists`

Purpose: Companies selected for ongoing monitoring.

Key fields:

- `id`
- `company_id`
- `added_by`
- `added_at`
- `is_active`
- `removed_by`
- `removed_at`
- `watch_reason`
- `last_checked_at`

Relationships:

- Belongs to `companies`.
- Has many `monitoring_events`.

Audit considerations:

- Track add/remove actions.
- Do not delete historical watchlist membership.

### `monitoring_events`

Purpose: Detected changes for watched companies.

Key fields:

- `id`
- `company_id`
- `watchlist_id`
- `event_type`
- `severity`
- `source_type`
- `source_id`
- `previous_value_json`
- `new_value_json`
- `detected_at`
- `acknowledged_by`
- `acknowledged_at`

Relationships:

- Belongs to `companies`.
- May belong to `watchlists`.
- May reference source records.

Audit considerations:

- Preserve before/after values for material changes.
- Track acknowledgement separately from detection.

### `report_exports`

Purpose: Generated report records.

Key fields:

- `id`
- `company_id`
- `snapshot_id`
- `score_run_id`
- `decision_record_id`
- `report_type`
- `file_path`
- `file_hash`
- `exported_by`
- `exported_at`
- `included_sections_json`

Relationships:

- Belongs to `companies`.
- Belongs to `company_snapshots`.
- Belongs to `score_runs`.
- May reference `decision_records`.

Audit considerations:

- Store exact score run and snapshot used.
- Store hash to prove report integrity.

### `audit_events`

Purpose: Immutable log of material user/system actions.

Key fields:

- `id`
- `actor_id`
- `actor_type`
- `event_type`
- `entity_type`
- `entity_id`
- `company_id`
- `metadata_json`
- `ip_address`
- `user_agent`
- `created_at`

Relationships:

- May reference any business entity.
- Often references `companies`.

Audit considerations:

- Append-only.
- Do not store secrets or sensitive tokens.

### `sic_risk_weights`

Purpose: Configurable sector weighting by SIC code.

Key fields:

- `id`
- `sic_code`
- `sector_label`
- `risk_weight`
- `rationale`
- `model_version_id`
- `is_active`
- `created_by`
- `created_at`

Relationships:

- Belongs to `scoring_model_versions`.
- Used by score runs through model configuration.

Audit considerations:

- Version SIC weights with the scoring model.
- Store rationale for each adjustment.

### `scoring_model_versions`

Purpose: Versioned scoring configuration.

Key fields:

- `id`
- `version`
- `status`
- `effective_from`
- `effective_to`
- `band_thresholds_json`
- `factor_weights_json`
- `limit_rules_json`
- `change_note`
- `created_by`
- `created_at`
- `published_by`
- `published_at`

Relationships:

- Has many `score_runs`.
- Has many `sic_risk_weights`.

Audit considerations:

- Published versions are immutable.
- Draft versions can be edited until published.
- Historical score runs keep their original model version.

