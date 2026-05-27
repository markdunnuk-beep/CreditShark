import type { Metadata, Route } from "next";
import Link from "next/link";
import { formatDecisionLabel } from "../../../../src/lib/decisions/decision-service";
import { CREDITSHARK_PRODUCT_GUARDRAIL } from "../../../../src/lib/guardrails";
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
    <section className="page-shell">
      <div className="profile-header">
        <div>
          <p className="eyebrow">Score history</p>
          <h1 className="page-title">{data.company.company_name}</h1>
          <p className="lede">
            Historical CreditShark checks for this company. The newest row is the latest check and current advisory risk view.
          </p>
        </div>
        <div className="profile-actions">
          <Link className="button-secondary" href={`/companies/${data.company.company_number}`}>
            Back to profile
          </Link>
          <Link className="button-secondary" href={"/watchlist" as Route}>
            Watchlist
          </Link>
          <Link className="button-secondary" href={`/companies/${data.company.company_number}/score`}>
            Latest score explanation
          </Link>
        </div>
      </div>

      <div className="status-note status-note--compact">{CREDITSHARK_PRODUCT_GUARDRAIL}</div>

      {data.latest ? (
        <div className="score-explanation-grid">
          <section className="card score-summary-card decision-summary-panel">
            <div className="score-hero">
              <div>
                <span className={`risk-badge risk-badge--${data.latest.risk_band}`}>{formatHistoryValue(data.latest.risk_band)}</span>
                <h2>Latest check</h2>
              </div>
              <div className="score-value">{data.latest.score ?? "NS"}</div>
            </div>
            <dl className="detail-grid">
              <Detail label="Company number" value={data.company.company_number} />
              <Detail label="Confidence" value={formatHistoryValue(data.latest.confidence_level)} />
              <Detail label="Recommended limit" value={formatHistoryMoney(data.latest.recommended_limit, data.latest.currency)} />
              <Detail label="Checked" value={formatDateTime(data.latest.run_at)} />
              <Detail label="Source timestamp" value={formatDateTime(data.latest.source_fetched_at)} />
              <Detail label="Model version" value={data.latest.model_version} />
            </dl>
          </section>

          <aside className="card ocean-card">
            <p className="eyebrow">Movement summary</p>
            <h2>{data.movement.message}</h2>
            {data.movement.bandMessage ? <p className="note">{data.movement.bandMessage}</p> : null}
            <dl className="detail-grid detail-grid--compact">
              <Detail label="Latest score" value={data.movement.latestScore == null ? "Not scored" : String(data.movement.latestScore)} />
              <Detail label="Previous score" value={data.movement.previousScore == null ? "Not available" : String(data.movement.previousScore)} />
            </dl>
          </aside>
        </div>
      ) : (
        <div className="empty-state">No score runs are available yet. Open the company profile to run the latest CreditShark check.</div>
      )}

      {data.rows.length > 1 ? <ScoreTrend rows={data.rows.slice(0, 8).reverse()} /> : null}

      <section className="card score-section">
        <div className="section-heading">
          <h2>Historical score runs</h2>
          <span className="badge">{data.rows.length} checks</span>
        </div>
        <p className="note">
          History reflects CreditShark score runs at the time each check was made, using the source snapshot, scoring model version and manual data available then.
        </p>
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

      <section className="card score-section">
        <div className="section-heading">
          <h2>Source-change compatibility</h2>
          <span className="badge">Future monitoring ready</span>
        </div>
        <p className="note">
          Future source-triggered changes can be attached to this timeline when new accounts, filings, charge changes, officer or PSC changes, manual adverse events, or licensed adverse data become available.
        </p>
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
    <section className="card score-section">
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
