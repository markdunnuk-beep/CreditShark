import { getManualAdverseEventsForCompany } from "../adverse/manual-adverse-event-service";
import { getLatestSnapshotForCompany, getLatestScoreRunForCompany } from "../scoring/scoring-service";
import { getWatchlistItemForCompany } from "../watchlist/watchlist-service";

export interface CompanyWorkspaceHeaderViewModel {
  companyName: string;
  companyNumber: string;
  companyStatus: string | null;
  latestCheckAt: string | null;
  companiesHouseEvidenceAt: string | null;
  advisoryScore: number | null;
  riskBand: string | null;
  recommendedLimit: number | null;
  currency: string;
  confidence: string | null;
  activeManualDataCount: number;
  isWatched: boolean;
  unavailableReason: string | null;
}

export async function getCompanyWorkspaceHeader(companyNumber: string): Promise<CompanyWorkspaceHeaderViewModel> {
  const [scoreResult, snapshotResult, manualResult, watchlistResult] = await Promise.all([
    getLatestScoreRunForCompany(companyNumber),
    getLatestSnapshotForCompany(companyNumber),
    getManualAdverseEventsForCompany(companyNumber),
    getWatchlistItemForCompany(companyNumber)
  ]);

  if (scoreResult.ok) {
    return {
      companyName: scoreResult.data.company.company_name,
      companyNumber: scoreResult.data.company.company_number,
      companyStatus: scoreResult.data.company.company_status,
      latestCheckAt: scoreResult.data.scoreRun.runAt ?? null,
      companiesHouseEvidenceAt: scoreResult.data.snapshot.source_fetched_at,
      advisoryScore: scoreResult.data.scoreRun.score,
      riskBand: scoreResult.data.scoreRun.riskBand,
      recommendedLimit: scoreResult.data.scoreRun.recommendedLimit,
      currency: scoreResult.data.scoreRun.currency,
      confidence: scoreResult.data.scoreRun.confidenceLevel,
      activeManualDataCount: manualResult.ok ? manualResult.data.activeEvents.length : 0,
      isWatched: watchlistResult.ok ? Boolean(watchlistResult.data.watchlist) : false,
      unavailableReason: null
    };
  }

  if (snapshotResult.ok) {
    return {
      companyName: snapshotResult.data.company.company_name,
      companyNumber: snapshotResult.data.company.company_number,
      companyStatus: snapshotResult.data.company.company_status,
      latestCheckAt: null,
      companiesHouseEvidenceAt: snapshotResult.data.snapshot.source_fetched_at,
      advisoryScore: null,
      riskBand: null,
      recommendedLimit: null,
      currency: "GBP",
      confidence: null,
      activeManualDataCount: manualResult.ok ? manualResult.data.activeEvents.length : 0,
      isWatched: watchlistResult.ok ? Boolean(watchlistResult.data.watchlist) : false,
      unavailableReason: scoreResult.error.message
    };
  }

  return {
    companyName: "Company workspace",
    companyNumber,
    companyStatus: null,
    latestCheckAt: null,
    companiesHouseEvidenceAt: null,
    advisoryScore: null,
    riskBand: null,
    recommendedLimit: null,
    currency: "GBP",
    confidence: null,
    activeManualDataCount: 0,
    isWatched: false,
    unavailableReason: scoreResult.error.message
  };
}

export function formatCompanyWorkspaceValue(value: string | number | null | undefined): string {
  if (value == null || value === "") return "Not available";
  return String(value).replace(/_/g, " ");
}

export function formatCompanyWorkspaceMoney(value: number | null | undefined, currency = "GBP"): string {
  if (value == null || Number.isNaN(value)) return "Not recorded";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatCompanyWorkspaceDateTime(value: string | null | undefined): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
