import type { Route } from "next";
import Link from "next/link";
import {
  ADVISORY_SCORE_LABEL,
  COMPANIES_HOUSE_EVIDENCE_LABEL,
  LATEST_CHECK_LABEL,
  MANUAL_DATA_INCLUDED_LABEL
} from "../../src/lib/guardrails";
import {
  formatCompanyWorkspaceDateTime,
  formatCompanyWorkspaceMoney,
  formatCompanyWorkspaceValue,
  type CompanyWorkspaceHeaderViewModel
} from "../../src/lib/company-workspace/company-workspace-service";
import { addCompanyToWatchlistAction, removeCompanyFromWatchlistAction } from "../watchlist/actions";
import { CompanyWorkspaceTabs } from "./company-workspace-tabs";
import { MetricCard, RiskBadge, TradeRiskScoreGauge } from "./ui";

export function CompanyWorkspaceShell({
  header,
  children
}: {
  header: CompanyWorkspaceHeaderViewModel;
  children: React.ReactNode;
}) {
  return (
    <div className="company-workspace">
      <section className="company-workspace-header" aria-label="Company workspace summary">
        <div className="company-workspace-header__top">
          <div>
            <p className="eyebrow">Company workspace</p>
            <h1 className="company-workspace-title">{header.companyName}</h1>
            <div className="company-workspace-meta">
              <span>{header.companyNumber}</span>
              <span>{formatCompanyWorkspaceValue(header.companyStatus)}</span>
              <span>{LATEST_CHECK_LABEL}: {formatCompanyWorkspaceDateTime(header.latestCheckAt)}</span>
              <span>{COMPANIES_HOUSE_EVIDENCE_LABEL}: {formatCompanyWorkspaceDateTime(header.companiesHouseEvidenceAt)}</span>
            </div>
          </div>
          <div className="company-workspace-actions" aria-label="Company actions">
            <Link className="button-primary" href={`/companies/${header.companyNumber}/decision`}>
              Record decision
            </Link>
            <Link className="button-secondary" href={`/companies/${header.companyNumber}/report`}>
              View report
            </Link>
            <Link className="button-secondary" href={`/companies/${header.companyNumber}/adverse`}>
              Add manual data
            </Link>
          </div>
        </div>

        <div className="company-workspace-metrics" aria-label="Current trade-risk summary">
          <div className="company-workspace-score-gauge">
            <span>{ADVISORY_SCORE_LABEL}</span>
            <TradeRiskScoreGauge
              score={header.advisoryScore}
              rating={formatCompanyWorkspaceValue(header.riskBand)}
              lastUpdated={formatCompanyWorkspaceDateTime(header.latestCheckAt)}
            />
          </div>
          <MetricCard
            className="company-workspace-metric"
            label="Risk band"
            value={formatCompanyWorkspaceValue(header.riskBand)}
            status={<RiskBadge riskBand={header.riskBand} />}
          />
          <MetricCard
            className="company-workspace-metric"
            label="Recommended limit"
            value={formatCompanyWorkspaceMoney(header.recommendedLimit, header.currency)}
          />
          <MetricCard
            className="company-workspace-metric"
            label="Confidence"
            value={formatCompanyWorkspaceValue(header.confidence)}
          />
        </div>

        <div className="company-workspace-flags">
          {header.activeManualDataCount > 0 ? (
            <span className="badge manual-badge">{MANUAL_DATA_INCLUDED_LABEL}: {header.activeManualDataCount}</span>
          ) : (
            <span className="badge">No active manual data</span>
          )}
          <span className="badge">{header.isWatched ? "On watchlist" : "Not on watchlist"}</span>
          {header.isWatched ? (
            <form action={removeCompanyFromWatchlistAction.bind(null, header.companyNumber, "profile")} className="company-workspace-inline-form">
              <button type="submit">Remove from watchlist</button>
            </form>
          ) : (
            <form action={addCompanyToWatchlistAction.bind(null, header.companyNumber)} className="company-workspace-inline-form">
              <button type="submit">Add to watchlist</button>
            </form>
          )}
          <Link href={"/watchlist" as Route}>Watchlist</Link>
          <Link href={`/companies/${header.companyNumber}/history`}>View score history</Link>
          {header.unavailableReason ? <span className="company-workspace-muted">{header.unavailableReason}</span> : null}
        </div>

        <CompanyWorkspaceTabs companyNumber={header.companyNumber} />
      </section>

      <div className="company-workspace-content">{children}</div>
    </div>
  );
}
