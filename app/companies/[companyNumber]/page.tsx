import type { Metadata, Route } from "next";
import Link from "next/link";
import { createCompanySnapshotFromCompaniesHouse } from "../../../src/lib/companies/company-snapshot-service";
import type { CompanySnapshotStage, CreatedCompanySnapshot } from "../../../src/lib/companies/company-snapshot-service";
import {
  COMPANIES_HOUSE_EVIDENCE_LABEL,
  MANUAL_DATA_INCLUDED_LABEL
} from "../../../src/lib/guardrails";
import { getManualAdverseEventsForCompany } from "../../../src/lib/adverse/manual-adverse-event-service";
import { formatDecisionLabel, formatDecisionMoney, getLatestDecisionForCompany, type DecisionRecord } from "../../../src/lib/decisions/decision-service";
import { getScoreHistorySummary, type ScoreHistoryViewModel } from "../../../src/lib/history/score-history-service";
import { runAndPersistScoreForLatestSnapshot, type ScoreRunResult } from "../../../src/lib/scoring/scoring-service";
import { getWatchlistItemForCompany, type WatchlistItem } from "../../../src/lib/watchlist/watchlist-service";
import type { ScoreReasonCode } from "../../../src/types/creditshark";
import {
  ActionGroup,
  Badge,
  ButtonLink,
  Card,
  DetailList,
  EvidenceChip,
  EvidencePanel,
  MetricCard,
  Notice,
  ReasonCodeCard,
  RiskBadge,
  SectionHeader
} from "../../components/ui";

export const metadata: Metadata = {
  title: "Company profile"
};

export const dynamic = "force-dynamic";

export default async function CompanyProfilePage({ params }: { params: Promise<{ companyNumber: string }> }) {
  const { companyNumber } = await params;
  const result = await createCompanySnapshotFromCompaniesHouse(companyNumber, { createdVia: "company_profile_route" });

  if (!result.ok) {
    return <CompanyProfileError companyNumber={companyNumber} message={result.error.message} stage={result.error.stage} referenceCode={result.error.referenceCode} />;
  }

  const scoreResult = await runAndPersistScoreForLatestSnapshot(result.data.company.company_number, {
    createdVia: "company_profile_route"
  });
  const manualEventsResult = await getManualAdverseEventsForCompany(result.data.company.company_number);
  const latestDecisionResult = await getLatestDecisionForCompany(result.data.company.company_number);
  const scoreHistoryResult = await getScoreHistorySummary(result.data.company.company_number);
  const watchlistResult = await getWatchlistItemForCompany(result.data.company.company_number);

  return (
    <CompanyProfile
      data={result.data}
      scoreResult={scoreResult.ok ? scoreResult.data : null}
      scoreError={scoreResult.ok ? null : scoreResult.error.message}
      activeManualEventCount={manualEventsResult.ok ? manualEventsResult.data.activeEvents.length : 0}
      latestDecision={latestDecisionResult.ok ? latestDecisionResult.data.decision : null}
      scoreHistory={scoreHistoryResult.ok ? scoreHistoryResult.data : null}
      watchlistItem={watchlistResult.ok ? watchlistResult.data.watchlist : null}
    />
  );
}

function CompanyProfile({
  data,
  scoreResult,
  scoreError,
  activeManualEventCount,
  latestDecision,
  scoreHistory,
  watchlistItem
}: {
  data: CreatedCompanySnapshot;
  scoreResult: ScoreRunResult | null;
  scoreError: string | null;
  activeManualEventCount: number;
  latestDecision: DecisionRecord | null;
  scoreHistory: ScoreHistoryViewModel | null;
  watchlistItem: WatchlistItem | null;
}) {
  const company = data.company;
  const snapshot = data.snapshot;
  const topPositiveReasons = scoreResult?.reasonCodes.filter((reason) => reason.direction === "positive").slice(0, 2) ?? [];
  const topNegativeReasons = scoreResult?.reasonCodes.filter((reason) => reason.direction === "negative" || reason.direction === "missing").slice(0, 3) ?? [];
  const hasMissingData = (scoreResult?.missingDataFlags.length ?? 0) > 0;

  return (
    <section className="company-tab-page">
      <Card className="tab-section tab-section--primary">
        <div className="tab-intro">
          <div>
            <p className="eyebrow">Current risk summary</p>
            <h2>Latest CreditShark check</h2>
            <p className="note">Captured {formatDateTime(data.sourceFetchedAt)}. This is the current advisory risk view; previous checks remain in score history.</p>
          </div>
          {scoreResult ? (
            <div className="compact-score-strip" aria-label="Current advisory score summary">
              <RiskBadge riskBand={scoreResult.scoreRun.riskBand} />
              <strong>{scoreResult.scoreRun.score ?? "NS"}</strong>
              <span>{formatMoney(scoreResult.scoreRun.recommendedLimit, scoreResult.scoreRun.currency)}</span>
              <span>Confidence: {formatValue(scoreResult.scoreRun.confidenceLevel)}</span>
            </div>
          ) : null}
        </div>

          {scoreResult ? (
            <>
              <div className="driver-columns" aria-label="Top score reasons">
                <ReasonDriverGroup title="What helps" reasons={topPositiveReasons} emptyText="No positive drivers were emitted for this score." />
                <ReasonDriverGroup title="What needs review" reasons={topNegativeReasons} emptyText="No review factors were emitted for this score." />
              </div>
              {hasMissingData ? <Notice variant="missing" title="Data limitations">Data limitations: {scoreResult.missingDataFlags.join(", ")}.</Notice> : null}
            </>
          ) : (
            <>
              <h2>Score could not be run</h2>
              <Notice variant="error">{scoreError ?? "A scoring configuration error occurred."}</Notice>
            </>
          )}
      </Card>

      <Card className="tab-section">
        <SectionHeader title="Next best actions" action={<Badge>Workspace actions</Badge>} />
        <ActionGroup className="compact-action-group">
            {scoreResult ? (
              <ButtonLink href={`/companies/${company.company_number}/score`}>
                Review evidence
              </ButtonLink>
            ) : null}
            <ButtonLink variant="secondary" href={`/companies/${company.company_number}/adverse`}>
              Manual adverse events
            </ButtonLink>
            <ButtonLink variant="secondary" href={`/companies/${company.company_number}/report`}>
              Preview report
            </ButtonLink>
            <ButtonLink variant="secondary" href={historyRoute(company.company_number)}>
              View score history
            </ButtonLink>
            <ButtonLink variant="secondary" href={"/watchlist" as Route}>
              Watchlist
            </ButtonLink>
            <ButtonLink variant="secondary" href={`/companies/${company.company_number}/decision`}>
              Record decision
            </ButtonLink>
        </ActionGroup>
      </Card>

      <div className="profile-grid profile-grid--evidence">
        <EvidencePanel
          className="profile-summary-card tab-section"
          title="Key evidence snapshot"
          variant="companies_house"
          meta={<EvidenceChip sourceType="companies_house" label={COMPANIES_HOUSE_EVIDENCE_LABEL} />}
        >
          <div className="evidence-summary-grid" aria-label="Snapshot captured records">
            <MetricCard label="Filings" value={data.filingsSummary.count} />
            <MetricCard label="Active charges" value={data.chargesSummary.active} />
            <MetricCard label="Satisfied charges" value={data.chargesSummary.satisfied} />
            <MetricCard label="Officers" value={data.officersSummary.current} />
            <MetricCard label="PSC records" value={data.pscSummary.count} />
            <MetricCard label="Manual events" value={activeManualEventCount} />
          </div>
          <DetailList items={[
            { label: "Type", value: formatValue(company.company_type) },
            { label: "Jurisdiction", value: formatValue(company.jurisdiction) },
            { label: "Registered office postcode", value: formatValue(company.registered_office_postcode) },
            { label: "Incorporated", value: formatDate(company.incorporated_on) },
            { label: "Company age", value: formatAge(snapshot.derived_company_age_months) },
            { label: "Latest accounts", value: formatDate(snapshot.latest_accounts_date) },
            { label: "Latest confirmation statement", value: formatDate(snapshot.latest_confirmation_statement_date) },
            { label: "Source fetched", value: formatDateTime(data.sourceFetchedAt) }
          ]} />
        </EvidencePanel>

        <EvidencePanel
          className="workflow-side-card tab-section"
          title="Trade context"
          variant="decision"
          meta={<Badge>{watchlistItem ? "Watching" : "Not watching"}</Badge>}
        >
          {latestDecision ? (
            <p className="note">Latest decision: <strong>{formatDecisionLabel(latestDecision.decision_value)}</strong>. Final limit: {formatDecisionMoney(latestDecision.approved_limit, latestDecision.currency)}.</p>
          ) : (
            <p className="note">No user-recorded commercial decision has been attached yet.</p>
          )}
          {scoreHistory?.latest ? (
            <p className="note">History: latest {scoreHistory.latest.score ?? "NS"}, previous {scoreHistory.previous?.score ?? "not available"}. {scoreHistory.movement.message}</p>
          ) : null}
          <Notice variant="manual">{MANUAL_DATA_INCLUDED_LABEL}: manual entries are shown separately from Companies House evidence.</Notice>
        </EvidencePanel>
      </div>

      {scoreResult ? (
        <details className="card secondary-audit-details">
          <summary>Audit details</summary>
          <DetailList compact items={[
            { label: "Snapshot id", value: snapshot.id },
            { label: "Score run id", value: scoreResult.scoreRun.id ?? "Not recorded" },
            { label: "Model version", value: scoreResult.modelVersion.version },
            { label: "Score run", value: formatDateTime(scoreResult.scoreRun.runAt) },
            { label: "Snapshot status", value: formatValue(snapshot.snapshot_status) },
            { label: "Missing/failed sections", value: String(data.missingSections.length) }
          ]} />
        </details>
      ) : null}

      {data.missingSections.length > 0 ? (
        <Notice variant="caution" title="Partial snapshot">
          These Companies House sections were unavailable or failed: {data.missingSections.join(", ")}.
        </Notice>
      ) : null}
    </section>
  );
}

function CompanyProfileError({
  companyNumber,
  message,
  stage,
  referenceCode
}: {
  companyNumber: string;
  message: string;
  stage: CompanySnapshotStage;
  referenceCode: string;
}) {
  return (
    <section className="page-shell">
      <div className="placeholder-stack">
        <p className="eyebrow">Company profile</p>
        <h1 className="page-title">Snapshot could not be created</h1>
        <div className="error-note" role="alert">
          <strong>{companyNumber}</strong>
          <div>{message}</div>
          <dl className="detail-grid detail-grid--compact">
            <Detail label="Failed stage" value={formatStage(stage)} />
            <Detail label="Reference" value={referenceCode} />
          </dl>
        </div>
        <div className="actions">
          <Link className="button-primary" href={`/companies/${companyNumber}`}>
            Retry profile
          </Link>
          <Link className="button-secondary" href="/search">
            Back to search
          </Link>
        </div>
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ReasonPreview({ reason }: { reason: ScoreReasonCode }) {
  return <ReasonCodeCard compact reason={reason} />;
}

function ReasonDriverGroup({ title, reasons, emptyText }: { title: string; reasons: ScoreReasonCode[]; emptyText: string }) {
  return (
    <div className="driver-group">
      <h3>{title}</h3>
      {reasons.length > 0 ? (
        <div className="reason-preview">
          {reasons.map((reason) => <ReasonPreview key={reason.code} reason={reason} />)}
        </div>
      ) : (
        <p className="note">{emptyText}</p>
      )}
    </div>
  );
}

function confidenceExplanation(value: string | null | undefined, hasMissingData: boolean): string {
  const confidence = formatValue(value).toLowerCase();
  if (hasMissingData) return `The ${confidence} confidence level reflects visible missing or limited data in the current evidence set.`;
  return `The ${confidence} confidence level reflects the evidence available in this snapshot and scoring model.`;
}

function formatValue(value: string | null | undefined): string {
  return value ? value.replace(/-/g, " ") : "Not available";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function formatRiskBand(value: string): string {
  return value.replace(/_/g, " ");
}

function formatStage(value: string): string {
  return value.replace(/_/g, " ");
}

function historyRoute(companyNumber: string): Route {
  return `/companies/${companyNumber}/history` as Route;
}

function formatSignedNumber(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function formatAge(months: number | null): string {
  if (months == null) return "Not available";
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} month${remainingMonths === 1 ? "" : "s"}`;
  return `${years} year${years === 1 ? "" : "s"} ${remainingMonths} month${remainingMonths === 1 ? "" : "s"}`;
}
