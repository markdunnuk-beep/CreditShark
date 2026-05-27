import type { Metadata, Route } from "next";
import Link from "next/link";
import { createCompanySnapshotFromCompaniesHouse } from "../../../src/lib/companies/company-snapshot-service";
import type { CompanySnapshotStage, CreatedCompanySnapshot } from "../../../src/lib/companies/company-snapshot-service";
import { CREDITSHARK_PRODUCT_GUARDRAIL } from "../../../src/lib/guardrails";
import { getManualAdverseEventsForCompany } from "../../../src/lib/adverse/manual-adverse-event-service";
import { formatDecisionLabel, formatDecisionMoney, getLatestDecisionForCompany, type DecisionRecord } from "../../../src/lib/decisions/decision-service";
import { getScoreHistorySummary, type ScoreHistoryViewModel } from "../../../src/lib/history/score-history-service";
import { runAndPersistScoreForLatestSnapshot, type ScoreRunResult } from "../../../src/lib/scoring/scoring-service";
import type { ScoreReasonCode } from "../../../src/types/creditshark";

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

  return (
    <CompanyProfile
      data={result.data}
      scoreResult={scoreResult.ok ? scoreResult.data : null}
      scoreError={scoreResult.ok ? null : scoreResult.error.message}
      activeManualEventCount={manualEventsResult.ok ? manualEventsResult.data.activeEvents.length : 0}
      latestDecision={latestDecisionResult.ok ? latestDecisionResult.data.decision : null}
      scoreHistory={scoreHistoryResult.ok ? scoreHistoryResult.data : null}
    />
  );
}

function CompanyProfile({
  data,
  scoreResult,
  scoreError,
  activeManualEventCount,
  latestDecision,
  scoreHistory
}: {
  data: CreatedCompanySnapshot;
  scoreResult: ScoreRunResult | null;
  scoreError: string | null;
  activeManualEventCount: number;
  latestDecision: DecisionRecord | null;
  scoreHistory: ScoreHistoryViewModel | null;
}) {
  const company = data.company;
  const snapshot = data.snapshot;
  const topPositiveReasons = scoreResult?.reasonCodes.filter((reason) => reason.direction === "positive").slice(0, 2) ?? [];
  const topNegativeReasons = scoreResult?.reasonCodes.filter((reason) => reason.direction === "negative" || reason.direction === "missing").slice(0, 3) ?? [];
  const hasMissingData = (scoreResult?.missingDataFlags.length ?? 0) > 0;

  return (
    <section className="page-shell">
      <div className="profile-header">
        <div>
        <p className="eyebrow">Company profile</p>
        <h1 className="page-title">{company.company_name}</h1>
        <p className="lede">
            Latest CreditShark check using a fresh Companies House snapshot and current advisory scoring context.
        </p>
        </div>
        <div className="profile-actions">
          <Link className="button-secondary" href="/search">
            Back to search
          </Link>
          <Link className="button-primary" href={`/companies/${company.company_number}`}>
            Refresh snapshot
          </Link>
        </div>
      </div>

      <div className="status-note status-note--compact">
        Latest check captured {formatDateTime(data.sourceFetchedAt)}. This is the current advisory risk view; previous checks remain available in score history.
      </div>

      <div className="decision-layout">
        <section className="card ocean-card decision-summary-panel">
          <p className="eyebrow">Decision summary</p>
          {scoreResult ? (
            <>
              <div className="decision-summary-grid">
                <div>
                  <span className={`risk-badge risk-badge--${scoreResult.scoreRun.riskBand}`}>
                    {formatRiskBand(scoreResult.scoreRun.riskBand)}
                  </span>
                  <h2>Advisory score</h2>
                  <div className="score-value score-value--large">{scoreResult.scoreRun.score ?? "NS"}</div>
                </div>
                <div className="limit-card">
                  <span className="preview-label">Recommended limit</span>
                  <strong>{formatMoney(scoreResult.scoreRun.recommendedLimit, scoreResult.scoreRun.currency)}</strong>
                  <p>
                    Based on the current advisory score, model version {scoreResult.modelVersion.version}, available Companies House evidence
                    and active manual data.
                  </p>
                </div>
              </div>
              <div className="confidence-strip">
                <strong>Confidence: {formatValue(scoreResult.scoreRun.confidenceLevel)}</strong>
                <span>{confidenceExplanation(scoreResult.scoreRun.confidenceLevel, hasMissingData)}</span>
              </div>
              <div className="driver-columns" aria-label="Top score reasons">
                <ReasonDriverGroup title="What helps" reasons={topPositiveReasons} emptyText="No positive drivers were emitted for this score." />
                <ReasonDriverGroup title="What needs review" reasons={topNegativeReasons} emptyText="No review factors were emitted for this score." />
              </div>
              {hasMissingData ? <div className="missing-data-warning">Data limitations: {scoreResult.missingDataFlags.join(", ")}.</div> : null}
            </>
          ) : (
            <>
              <h2>Score could not be run</h2>
              <div className="error-note" role="alert">{scoreError ?? "A scoring configuration error occurred."}</div>
            </>
          )}
          <div className="action-bar">
            {scoreResult ? (
              <Link className="button-primary" href={`/companies/${company.company_number}/score`}>
                Review evidence
              </Link>
            ) : null}
            <Link className="button-secondary" href={`/companies/${company.company_number}/adverse`}>
              Manual adverse events
            </Link>
            <Link className="button-secondary" href={`/companies/${company.company_number}/report`}>
              Preview report
            </Link>
            <Link className="button-secondary" href={historyRoute(company.company_number)}>
              View score history
            </Link>
            <Link className="button-secondary" href={`/companies/${company.company_number}/decision`}>
              Record decision
            </Link>
          </div>
          {scoreResult ? (
            <details className="audit-details">
              <summary>Audit metadata</summary>
              <dl className="detail-grid detail-grid--compact">
                <Detail label="Snapshot id" value={snapshot.id} />
                <Detail label="Score run" value={formatDateTime(scoreResult.scoreRun.runAt)} />
                <Detail label="Model version" value={scoreResult.modelVersion.version} />
                <Detail label="Snapshot status" value={formatValue(snapshot.snapshot_status)} />
              </dl>
            </details>
          ) : null}
        </section>
      </div>

      <div className="profile-grid profile-grid--evidence">
        <section className="card profile-summary-card">
          <div className="section-heading">
            <h2>Company identity</h2>
            <span className="source-chip source-chip--companies-house">Companies House evidence</span>
          </div>
          <dl className="detail-grid">
            <Detail label="Company number" value={company.company_number} />
            <Detail label="Status" value={formatValue(company.company_status)} />
            <Detail label="Type" value={formatValue(company.company_type)} />
            <Detail label="Jurisdiction" value={formatValue(company.jurisdiction)} />
            <Detail label="Registered office postcode" value={formatValue(company.registered_office_postcode)} />
            <Detail label="Incorporated" value={formatDate(company.incorporated_on)} />
            <Detail label="Company age" value={formatAge(snapshot.derived_company_age_months)} />
            <Detail label="Latest accounts" value={formatDate(snapshot.latest_accounts_date)} />
            <Detail label="Latest confirmation statement" value={formatDate(snapshot.latest_confirmation_statement_date)} />
            <Detail label="Source fetched" value={formatDateTime(data.sourceFetchedAt)} />
          </dl>
        </section>

        <aside className="card workflow-side-card">
          <div className="section-heading">
            <h2>Next actions</h2>
            <span className="badge">Advisory review</span>
          </div>
          <div className="secondary-action-list">
            <Link className="button-secondary" href={`/companies/${company.company_number}/score`}>
              Review score explanation
            </Link>
            <Link className="button-secondary" href={`/companies/${company.company_number}/adverse`}>
              Review manual data
            </Link>
            <Link className="button-primary" href={`/companies/${company.company_number}/report`}>
              Preview report
            </Link>
            <Link className="button-secondary" href={historyRoute(company.company_number)}>
              Score history
            </Link>
            <Link className="button-secondary" href={`/companies/${company.company_number}/decision`}>
              Record decision
            </Link>
          </div>
          <p className="note">Actions use the latest persisted snapshot and score context. Manual data is labelled separately.</p>
        </aside>
      </div>

      <section className="summary-cards" aria-label="Snapshot captured records">
        <SummaryCard label="Filing records captured" value={data.filingsSummary.count} />
        <SummaryCard label="Active charges" value={data.chargesSummary.active} />
        <SummaryCard label="Satisfied charges" value={data.chargesSummary.satisfied} />
        <SummaryCard label="Current officers" value={data.officersSummary.current} />
        <SummaryCard label="PSC records" value={data.pscSummary.count} />
        <SummaryCard label="Missing/failed sections" value={data.missingSections.length} />
      </section>

      <section className="card score-section manual-profile-card">
        <div>
          <div className="section-heading">
            <h2>Manual adverse events</h2>
            <span className="badge manual-badge">{activeManualEventCount} active</span>
          </div>
          <p className="note">User-entered risk notes and CCJ-style records. Manual data is labelled separately and should be reviewed before a decision.</p>
        </div>
        <Link className="button-secondary" href={`/companies/${company.company_number}/adverse`}>
          Review manual data
        </Link>
      </section>

      <section className="card score-section manual-profile-card">
        <div>
          <div className="section-heading">
            <h2>Score history</h2>
            <span className="badge">Latest check</span>
          </div>
          {scoreHistory?.latest ? (
            <p className="note">
              Latest check: <strong>{scoreHistory.latest.score ?? "NS"}</strong>. Previous check: <strong>{scoreHistory.previous?.score ?? "Not available"}</strong>. {scoreHistory.movement.message}
            </p>
          ) : (
            <p className="note">No score history is available yet beyond the current page load.</p>
          )}
        </div>
        <Link className="button-secondary" href={historyRoute(company.company_number)}>
          View score history
        </Link>
      </section>

      <section className="card score-section manual-profile-card">
        <div>
          <div className="section-heading">
            <h2>Advisory report</h2>
            <span className="badge">Latest snapshot and score</span>
          </div>
          <p className="note">Preview a print-friendly trade-risk report using the latest persisted snapshot, score run, source timestamps and data limitations.</p>
        </div>
        <Link className="button-primary" href={`/companies/${company.company_number}/report`}>
          Preview report
        </Link>
      </section>

      <section className="card score-section manual-profile-card">
        <div>
          <div className="section-heading">
            <h2>Recorded decision</h2>
            <span className="badge">User-recorded</span>
          </div>
          {latestDecision ? (
            <p className="note">
              Latest decision: <strong>{formatDecisionLabel(latestDecision.decision_value)}</strong>. Final limit: {formatDecisionMoney(latestDecision.approved_limit, latestDecision.currency)}.
            </p>
          ) : (
            <p className="note">No user-recorded commercial decision has been attached yet. Decisions are audit logged and linked to score evidence.</p>
          )}
        </div>
        <Link className="button-secondary" href={`/companies/${company.company_number}/decision`}>
          Record decision
        </Link>
      </section>

      {data.missingSections.length > 0 ? (
        <div className="error-note">
          <strong>Partial snapshot.</strong>
          <div>These Companies House sections were unavailable or failed: {data.missingSections.join(", ")}.</div>
        </div>
      ) : null}

      <div className="status-note">{CREDITSHARK_PRODUCT_GUARDRAIL}</div>
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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <div className="metric__label">{label}</div>
      <div className="metric__value">{value}</div>
    </div>
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
  return (
    <div className={`reason-pill reason-pill--${reason.direction}`}>
      <span>{reason.label}</span>
      <strong>{formatSignedNumber(reason.weight)}</strong>
    </div>
  );
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
