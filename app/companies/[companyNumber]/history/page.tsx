import type { Metadata } from "next";
import Link from "next/link";
import { formatDecisionLabel } from "../../../../src/lib/decisions/decision-service";
import { LATEST_CHECK_LABEL } from "../../../../src/lib/guardrails";
import {
  formatHistoryMoney,
  formatHistoryValue,
  getScoreHistoryForCompany,
  type ScoreHistoryRow,
  type ScoreHistoryViewModel
} from "../../../../src/lib/history/score-history-service";

export const metadata: Metadata = {
  title: "Score history"
};

export const dynamic = "force-dynamic";

export default async function CompanyScoreHistoryPage({ params }: { params: Promise<{ companyNumber: string }> }) {
  const { companyNumber } = await params;
  const result = await getScoreHistoryForCompany(companyNumber, { limit: 30 });

  if (!result.ok) {
    return <HistoryError companyNumber={companyNumber} message={result.error.message} />;
  }

  return <ScoreHistory data={result.data} />;
}

function ScoreHistory({ data }: { data: ScoreHistoryViewModel }) {
  return (
    <section className="company-tab-page">
      {data.latest ? (
        <section className="card tab-section tab-section--primary">
          <div className="tab-intro">
            <div>
              <p className="eyebrow">Score history</p>
              <h2>Movement summary</h2>
              <p className="note">Historical rows are previous CreditShark checks, not the current risk view.</p>
            </div>
            <div className="compact-score-strip">
              <span className={`risk-badge risk-badge--${data.latest.risk_band}`}>{formatHistoryValue(data.latest.risk_band)}</span>
              <strong>{data.latest.score ?? "NS"}</strong>
              <span>{data.movement.message}</span>
            </div>
          </div>
          <div className="history-movement-grid">
            <div>
              <span>{LATEST_CHECK_LABEL}</span>
              <strong>{data.latest.score ?? "NS"}</strong>
              <small>{formatDateTime(data.latest.run_at)}</small>
            </div>
            <div>
              <span>Previous check</span>
              <strong>{data.movement.previousScore == null ? "Not available" : String(data.movement.previousScore)}</strong>
              <small>{data.movement.bandMessage ?? "No previous band movement available."}</small>
            </div>
            <div>
              <span>Recommended limit</span>
              <strong>{formatHistoryMoney(data.latest.recommended_limit, data.latest.currency)}</strong>
              <small>Confidence: {formatHistoryValue(data.latest.confidence_level)}</small>
            </div>
          </div>
        </section>
      ) : (
        <div className="empty-state">No score runs are available yet. Open the company profile to run the latest CreditShark check.</div>
      )}

      {data.rows.length > 1 ? <ScoreTrend rows={data.rows.slice(0, 8).reverse()} /> : null}

      <section className="card tab-section">
        <div className="section-heading">
          <h2>Historical score runs</h2>
          <span className="badge">{data.rows.length} checks</span>
        </div>
        <div className="compact-action-group compact-action-group--left">
          <Link className="button-secondary" href={`/companies/${data.company.company_number}/score`}>View latest score</Link>
          <Link className="button-secondary" href={`/companies/${data.company.company_number}/report`}>View report</Link>
          <Link className="button-secondary" href={`/companies/${data.company.company_number}/decision`}>Record decision</Link>
        </div>
        {data.rows.length > 0 ? (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date checked</th>
                  <th>Score</th>
                  <th>Risk band</th>
                  <th>Confidence</th>
                  <th>Recommended limit</th>
                  <th>Key context</th>
                  <th>Decision</th>
                  <th>Report</th>
                  <th>Links</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, index) => <HistoryRow key={row.score_run_id} row={row} companyNumber={data.company.company_number} current={index === 0} />)}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

    </section>
  );
}

function ScoreTrend({ rows }: { rows: ScoreHistoryRow[] }) {
  const points = rows.map((row, index) => {
    const x = rows.length === 1 ? 50 : (index / (rows.length - 1)) * 100;
    const y = 100 - Math.max(0, Math.min(100, row.score ?? 0));
    return `${x},${y}`;
  }).join(" ");

  return (
    <section className="card tab-section">
      <div className="section-heading">
        <h2>Recent score trend</h2>
        <span className="badge">Latest {rows.length} checks</span>
      </div>
      <svg className="score-trend" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Recent score trend">
        <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
    </section>
  );
}

function HistoryRow({ row, companyNumber, current }: { row: ScoreHistoryRow; companyNumber: string; current: boolean }) {
  const context = row.top_review_reason ?? row.top_positive_reason;
  return (
    <tr>
      <td>
        <strong>{formatDateTime(row.run_at)}</strong>
        {current ? <span className="source-chip source-chip--model">Latest check</span> : <span className="source-chip">History</span>}
      </td>
      <td>{row.score ?? "NS"}</td>
      <td><span className={`risk-badge risk-badge--${row.risk_band}`}>{formatHistoryValue(row.risk_band)}</span></td>
      <td>{formatHistoryValue(row.confidence_level)}</td>
      <td>{formatHistoryMoney(row.recommended_limit, row.currency)}</td>
      <td>{context?.label ?? (row.missing_data_flags[0] ? `Missing data: ${row.missing_data_flags[0]}` : "No key reason emitted")}</td>
      <td>{row.decision ? formatDecisionLabel(row.decision.decision_value) : "Not recorded"}</td>
      <td>{row.report.export_count > 0 ? `${row.report.export_count} export${row.report.export_count === 1 ? "" : "s"}` : "Not exported"}</td>
      <td>
        <div className="table-actions">
          <Link href={`/companies/${companyNumber}/score`}>Score</Link>
          <Link href={`/companies/${companyNumber}/report`}>Report</Link>
          <Link href={`/companies/${companyNumber}/decision`}>Decision</Link>
        </div>
      </td>
    </tr>
  );
}

function HistoryError({ companyNumber, message }: { companyNumber: string; message: string }) {
  return (
    <section className="page-shell">
      <div className="placeholder-stack">
        <p className="eyebrow">Score history</p>
        <h1 className="page-title">Score history unavailable</h1>
        <div className="error-note" role="alert">
          <strong>{companyNumber}</strong>
          <div>{message}</div>
        </div>
        <Link className="button-primary" href={`/companies/${companyNumber}`}>
          Back to profile
        </Link>
      </div>
    </section>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
