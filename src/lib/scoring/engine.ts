import type {
  CompanySnapshot,
  ConfidenceLevel,
  ManualAdverseEvent,
  ManualOverrideState,
  RiskBand,
  ScoreReasonCode,
  ScoreRun,
  ScoringModelVersion
} from "../../types/creditshark.js";

export interface RunScoreInput {
  snapshot: CompanySnapshot;
  manualAdverseEvents: ManualAdverseEvent[];
  modelVersion: ScoringModelVersion;
}

export function runCreditSharkScore(input: RunScoreInput): ScoreRun {
  assertPublishedModel(input.modelVersion);

  const reasonCodes: ScoreReasonCode[] = [];
  const missingDataFlags = new Set<string>();
  const activeManualEvents = input.manualAdverseEvents.filter((event) => event.isActive && !event.supersededById);
  const hardStop = evaluateHardStop(input.snapshot);

  if (hardStop) {
    reasonCodes.push(hardStop);
    return {
      companyId: input.snapshot.companyId,
      snapshotId: input.snapshot.id,
      modelVersionId: input.modelVersion.id,
      score: hardStop.code === "COMPANY_DISSOLVED" ? 1 : null,
      riskBand: hardStop.code === "COMPANY_DISSOLVED" ? "very_high" : "not_scored",
      confidenceLevel: "insufficient",
      recommendedLimit: 0,
      currency: input.modelVersion.limitRules.currency,
      manualOverrideState: "review_required",
      missingDataFlags: ["hard_stop_status"],
      reasonCodes
    };
  }

  let score = numberWeight(input.modelVersion.factorWeights.baseline, 60);
  score += evaluateCompanyStatus(input.snapshot, reasonCodes);
  score += evaluateCompanyAge(input.snapshot, reasonCodes, missingDataFlags);
  score += evaluateFilingBehaviour(input.snapshot, reasonCodes, missingDataFlags);
  score += evaluateFinancialStrength(input.snapshot, reasonCodes, missingDataFlags);
  score += evaluateCharges(input.snapshot, reasonCodes);
  score += evaluateManualAdverseEvents(activeManualEvents, reasonCodes);
  score += evaluateDirectorPscSignals(input.snapshot, reasonCodes, missingDataFlags);
  score += evaluateSector(input.snapshot, reasonCodes, missingDataFlags);
  score += evaluateDataCompleteness(input.snapshot, reasonCodes, missingDataFlags);

  const boundedScore = Math.max(1, Math.min(100, Math.round(score)));
  const riskBand = mapScoreToRiskBand(boundedScore, input.modelVersion);
  const confidenceLevel = determineConfidenceLevel(input.snapshot, missingDataFlags);
  const manualOverrideState: ManualOverrideState = activeManualEvents.length > 0 ? "manual_data_present" : "none";

  return {
    companyId: input.snapshot.companyId,
    snapshotId: input.snapshot.id,
    modelVersionId: input.modelVersion.id,
    score: boundedScore,
    riskBand,
    confidenceLevel,
    recommendedLimit: calculateRecommendedLimit(riskBand, confidenceLevel, input.snapshot, manualOverrideState, input.modelVersion),
    currency: input.modelVersion.limitRules.currency,
    manualOverrideState,
    missingDataFlags: Array.from(missingDataFlags),
    reasonCodes: reasonCodes.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
  };
}

export function mapScoreToRiskBand(score: number | null, modelVersion: ScoringModelVersion): RiskBand {
  if (score === null) return "not_scored";

  const thresholds = modelVersion.bandThresholds;
  if (score >= thresholds.veryLowRisk.min) return "very_low";
  if (score >= thresholds.lowRisk.min) return "low";
  if (score >= thresholds.moderateRisk.min) return "moderate";
  if (score >= thresholds.highRisk.min) return "high";
  return "very_high";
}

function assertPublishedModel(modelVersion: ScoringModelVersion): void {
  if (modelVersion.status !== "published") {
    throw new Error("Only published scoring model versions can be used for score runs.");
  }
}

function evaluateHardStop(snapshot: CompanySnapshot): ScoreReasonCode | null {
  const status = normalise(snapshot.derivedStatus ?? snapshot.companyStatus);

  if (status.includes("dissolved")) {
    return reason("COMPANY_DISSOLVED", "Company is dissolved", "company_status", "negative", -100, "hard_stop", "companies_house_profile", snapshot.id, snapshot.sourceFetchedAt, "The company is dissolved, so a normal trade-credit recommendation cannot be produced.");
  }

  if (snapshot.hasInsolvencyHistory || status.includes("liquidation") || status.includes("administration") || status.includes("receivership")) {
    return reason("INSOLVENCY_OR_FORMAL_DISTRESS", "Insolvency or formal distress signal", "company_status", "negative", -100, "hard_stop", "companies_house_profile", snapshot.id, snapshot.sourceFetchedAt, "The company has an insolvency or formal distress signal and requires manual review.");
  }

  return null;
}

function evaluateCompanyStatus(snapshot: CompanySnapshot, reasons: ScoreReasonCode[]): number {
  const status = normalise(snapshot.derivedStatus ?? snapshot.companyStatus);
  if (status === "active") {
    reasons.push(reason("ACTIVE_COMPANY", "Active company", "company_status", "positive", 10, "medium", "companies_house_profile", snapshot.id, snapshot.sourceFetchedAt, "The company is currently active on Companies House."));
    return 10;
  }

  reasons.push(reason("NON_STANDARD_STATUS", "Non-standard company status", "company_status", "negative", -10, "material", "companies_house_profile", snapshot.id, snapshot.sourceFetchedAt, "The company status is not a standard active status and should be reviewed."));
  return -10;
}

function evaluateCompanyAge(snapshot: CompanySnapshot, reasons: ScoreReasonCode[], missingDataFlags: Set<string>): number {
  if (typeof snapshot.derivedCompanyAgeMonths !== "number") {
    missingDataFlags.add("company_age_missing");
    reasons.push(reason("COMPANY_AGE_MISSING", "Company age unavailable", "company_age", "missing", -4, "medium", "snapshot", snapshot.id, snapshot.sourceFetchedAt, "Company age could not be calculated from the available snapshot."));
    return -4;
  }

  if (snapshot.derivedCompanyAgeMonths < 12) {
    reasons.push(reason("VERY_NEW_COMPANY", "Very new company", "company_age", "negative", -18, "material", "companies_house_profile", snapshot.id, snapshot.incorporatedOn, "The company is less than 12 months old, so there is limited operating history."));
    return -18;
  }

  if (snapshot.derivedCompanyAgeMonths < 36) {
    reasons.push(reason("NEW_COMPANY", "Newer company", "company_age", "negative", -12, "medium", "companies_house_profile", snapshot.id, snapshot.incorporatedOn, "The company has a short trading history."));
    return -12;
  }

  reasons.push(reason("ESTABLISHED_COMPANY", "Established company age", "company_age", "positive", 8, "low", "companies_house_profile", snapshot.id, snapshot.incorporatedOn, "The company has an established filing history period."));
  return 8;
}

function evaluateFilingBehaviour(snapshot: CompanySnapshot, reasons: ScoreReasonCode[], missingDataFlags: Set<string>): number {
  let score = 0;

  if (!snapshot.latestAccountsDate) {
    missingDataFlags.add("latest_accounts_missing");
    reasons.push(reason("LATEST_ACCOUNTS_MISSING", "Latest accounts date unavailable", "filing_behaviour", "missing", -8, "material", "snapshot", snapshot.id, snapshot.sourceFetchedAt, "The latest accounts date is unavailable, reducing confidence in the score."));
    score -= 8;
  } else {
    reasons.push(reason("ACCOUNTS_DATE_AVAILABLE", "Latest accounts date available", "filing_behaviour", "positive", 4, "low", "companies_house_profile", snapshot.id, snapshot.latestAccountsDate, "The snapshot includes a latest accounts date."));
    score += 4;
  }

  if (!snapshot.latestConfirmationStatementDate) {
    missingDataFlags.add("confirmation_statement_missing");
    reasons.push(reason("CONFIRMATION_STATEMENT_MISSING", "Confirmation statement date unavailable", "filing_behaviour", "missing", -4, "medium", "snapshot", snapshot.id, snapshot.sourceFetchedAt, "The latest confirmation statement date is unavailable."));
    score -= 4;
  }

  return score;
}

function evaluateFinancialStrength(snapshot: CompanySnapshot, reasons: ScoreReasonCode[], missingDataFlags: Set<string>): number {
  const latestAccounts = snapshot.accounts?.[0];
  if (!latestAccounts) {
    missingDataFlags.add("financial_metrics_missing");
    reasons.push(reason("FINANCIAL_METRICS_MISSING", "Financial metrics unavailable", "financial_strength", "missing", -8, "material", "company_accounts", undefined, snapshot.latestAccountsDate, "Structured financial metrics are not available yet, so financial strength is treated as incomplete."));
    return -8;
  }

  if (typeof latestAccounts.netAssets === "number" && latestAccounts.netAssets < 0) {
    reasons.push(reason("NEGATIVE_NET_ASSETS", "Negative net assets", "financial_strength", "negative", -15, "material", "company_accounts", latestAccounts.id, latestAccounts.periodEnd, "Latest extracted accounts show negative net assets."));
    return -15;
  }

  reasons.push(reason("FINANCIAL_METRICS_PRESENT", "Financial metrics present", "financial_strength", "positive", 4, "low", "company_accounts", latestAccounts.id, latestAccounts.periodEnd, "Structured financial metrics are available for the score."));
  return 4;
}

function evaluateCharges(snapshot: CompanySnapshot, reasons: ScoreReasonCode[]): number {
  const activeCharges = snapshot.charges?.filter((charge) => normalise(charge.status).includes("outstanding") || normalise(charge.status).includes("active")) ?? [];
  if (activeCharges.length === 0) return 0;

  const weight = -Math.min(18, activeCharges.length * 6);
  reasons.push(reason("ACTIVE_CHARGES_PRESENT", "Active charges present", "charges", "negative", weight, "medium", "company_charges", activeCharges[0]?.id, activeCharges[0]?.createdOn, "The company has active charges, which may indicate secured borrowing or encumbered assets."));
  return weight;
}

function evaluateManualAdverseEvents(events: ManualAdverseEvent[], reasons: ScoreReasonCode[]): number {
  if (events.length === 0) return 0;

  const material = events.some((event) => (event.amount ?? 0) >= 10000 && !normalise(event.status).includes("satisfied"));
  const weight = material ? -25 : -8;
  reasons.push(reason("MANUAL_ADVERSE_EVENTS_PRESENT", "Manual adverse events present", "manual_adverse_events", "negative", weight, material ? "material" : "medium", "manual_adverse_event", events[0]?.id, events[0]?.eventDate, "Authorised users have entered manual adverse-event data that must be reviewed alongside Companies House evidence."));
  return weight;
}

function evaluateDirectorPscSignals(snapshot: CompanySnapshot, reasons: ScoreReasonCode[], missingDataFlags: Set<string>): number {
  if (!snapshot.officers || snapshot.officers.length === 0) {
    missingDataFlags.add("officers_missing");
    reasons.push(reason("OFFICERS_MISSING", "Officer data unavailable", "director_psc_signals", "missing", -3, "low", "company_officers", undefined, snapshot.sourceFetchedAt, "Officer data is unavailable in this snapshot."));
    return -3;
  }

  return 0;
}

function evaluateSector(snapshot: CompanySnapshot, reasons: ScoreReasonCode[], missingDataFlags: Set<string>): number {
  if (!snapshot.sicCodes || snapshot.sicCodes.length === 0) {
    missingDataFlags.add("sic_missing");
    reasons.push(reason("SIC_MISSING", "SIC code unavailable", "sic_sector", "missing", 0, "low", "companies_house_profile", snapshot.id, snapshot.sourceFetchedAt, "No SIC code is available, so no sector adjustment has been applied."));
  }

  return 0;
}

function evaluateDataCompleteness(snapshot: CompanySnapshot, reasons: ScoreReasonCode[], missingDataFlags: Set<string>): number {
  const missingSections = snapshot.missingSections ?? [];
  if (missingSections.length === 0) return 0;

  for (const section of missingSections) {
    missingDataFlags.add(`section_missing:${section}`);
  }

  reasons.push(reason("SNAPSHOT_SECTIONS_MISSING", "Snapshot has missing source sections", "data_completeness", "missing", -10, "material", "snapshot", snapshot.id, snapshot.sourceFetchedAt, "One or more source sections failed or were unavailable when this snapshot was created."));
  return -10;
}

function determineConfidenceLevel(snapshot: CompanySnapshot, missingDataFlags: Set<string>): ConfidenceLevel {
  if (missingDataFlags.has("hard_stop_status")) return "insufficient";
  if ((snapshot.missingSections?.length ?? 0) > 0 || missingDataFlags.has("financial_metrics_missing")) return "low";
  if (missingDataFlags.size > 0) return "medium";
  return "high";
}

function calculateRecommendedLimit(
  riskBand: RiskBand,
  confidenceLevel: ConfidenceLevel,
  snapshot: CompanySnapshot,
  manualOverrideState: ManualOverrideState,
  modelVersion: ScoringModelVersion
): number {
  if (riskBand === "not_scored" || manualOverrideState === "review_required") return 0;

  const defaultLimit = modelVersion.limitRules.defaultLimits[riskBandToLimitKey(riskBand)] ?? 0;
  const confidenceCap = modelVersion.limitRules.confidenceCaps[confidenceLevel];
  const ageCap = typeof snapshot.derivedCompanyAgeMonths === "number" && snapshot.derivedCompanyAgeMonths < 12
    ? modelVersion.limitRules.newCompanyCap
    : null;

  return Math.min(defaultLimit, confidenceCap ?? defaultLimit, ageCap ?? defaultLimit);
}

function riskBandToLimitKey(riskBand: RiskBand): string {
  const map: Record<RiskBand, string> = {
    very_low: "veryLowRisk",
    low: "lowRisk",
    moderate: "moderateRisk",
    high: "highRisk",
    very_high: "veryHighRisk",
    not_scored: "notScored"
  };
  return map[riskBand];
}

function reason(
  code: string,
  label: string,
  group: string,
  direction: ScoreReasonCode["direction"],
  weight: number,
  impact: ScoreReasonCode["impact"],
  sourceType: string,
  sourceId: string | undefined,
  sourceDate: string | undefined,
  explanation: string
): ScoreReasonCode {
  return { code, label, group, direction, weight, impact, sourceType, sourceId, sourceDate, explanation };
}

function normalise(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function numberWeight(value: unknown, fallback: number): number {
  return typeof value === "number" ? value : fallback;
}

