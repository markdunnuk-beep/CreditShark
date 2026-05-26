export type RiskBand = "very_low" | "low" | "moderate" | "high" | "very_high" | "not_scored";
export type ConfidenceLevel = "high" | "medium" | "low" | "insufficient";
export type ReasonDirection = "positive" | "negative" | "neutral" | "missing";
export type ManualOverrideState = "none" | "manual_data_present" | "overridden" | "review_required";

export interface CompanySnapshot {
  id: string;
  companyId: string;
  companyNumber: string;
  companyName: string;
  sourceFetchedAt: string;
  derivedStatus?: string;
  companyStatus?: string;
  companyType?: string;
  incorporatedOn?: string;
  dissolvedOn?: string;
  derivedCompanyAgeMonths?: number;
  latestAccountsDate?: string;
  latestConfirmationStatementDate?: string;
  hasInsolvencyHistory?: boolean;
  sicCodes?: string[];
  missingSections?: string[];
  filings?: Array<{
    id?: string;
    filingType?: string;
    category?: string;
    filingDate?: string;
    madeUpDate?: string;
  }>;
  accounts?: Array<{
    id?: string;
    periodEnd?: string;
    accountsType?: string;
    currency?: string;
    turnover?: number;
    profitBeforeTax?: number;
    profitAfterTax?: number;
    netAssets?: number;
    cash?: number;
    totalLiabilities?: number;
    employees?: number;
    extractionMethod?: string;
  }>;
  charges?: Array<{
    id?: string;
    status?: string;
    createdOn?: string;
    satisfiedOn?: string;
  }>;
  officers?: Array<{
    id?: string;
    officerName: string;
    officerRole?: string;
    appointedOn?: string;
    resignedOn?: string;
  }>;
  pscs?: Array<{
    id?: string;
    pscName: string;
    pscKind?: string;
    ceasedOn?: string;
  }>;
}

export interface ManualAdverseEvent {
  id: string;
  companyId: string;
  eventType: string;
  eventDate: string;
  amount?: number;
  currency: string;
  status: string;
  sourceNote: string;
  evidenceReference?: string;
  enteredBy: string;
  enteredAt: string;
  supersededById?: string;
  isActive: boolean;
}

export interface ScoringModelVersion {
  id: string;
  version: string;
  status: "draft" | "published" | "retired";
  bandThresholds: ScoringBandThresholds;
  factorWeights: ScoringFactorWeights;
  limitRules: ScoringLimitRules;
  changeNote: string;
}

export interface ScoringBandThresholds {
  veryLowRisk: { min: number; max: number };
  lowRisk: { min: number; max: number };
  moderateRisk: { min: number; max: number };
  highRisk: { min: number; max: number };
  veryHighRisk: { min: number; max: number };
  notScored: null;
}

export interface ScoringFactorWeights {
  baseline: number;
  companyStatus: Record<string, unknown>;
  companyAge: Record<string, number>;
  filingBehaviour: Record<string, number>;
  financialStrength: Record<string, number>;
  charges: Record<string, number>;
  manualAdverseEvents: Record<string, number | boolean>;
  directorPscSignals: Record<string, number>;
  sicSector: Record<string, number>;
  dataCompleteness: Record<string, number>;
}

export interface ScoringLimitRules {
  currency: string;
  defaultLimits: Record<string, number>;
  confidenceCaps: Record<ConfidenceLevel, number | null>;
  newCompanyCap: number;
  manualReviewCap: number;
}

export interface ScoreReasonCode {
  code: string;
  label: string;
  group: string;
  direction: ReasonDirection;
  weight: number;
  impact: "low" | "medium" | "high" | "material" | "hard_stop";
  sourceType: string;
  sourceId?: string;
  sourceDate?: string;
  explanation: string;
}

export interface ScoreRun {
  id?: string;
  companyId: string;
  snapshotId: string;
  modelVersionId: string;
  score: number | null;
  riskBand: RiskBand;
  confidenceLevel: ConfidenceLevel;
  recommendedLimit: number;
  currency: string;
  manualOverrideState: ManualOverrideState;
  missingDataFlags: string[];
  reasonCodes: ScoreReasonCode[];
  runAt?: string;
}

