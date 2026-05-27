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
import { ActionGroup, Badge, ButtonLink, Card, EvidenceChip, MetricCard, RiskBadge, SectionHeader } from "../../../components/ui";

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
        <Card className="tab-section tab-section--primary">
          <div className="tab-intro">
            <div>
              <p className="eyebrow">Score history</p>
              <h2>Movement summary</h2>
              <p className="note">Historical rows are previous CreditShark checks, not the current risk view.</p>
            </div>
            <div className="compact-score-strip">
              <RiskBadge riskBand={data.latest.risk_band} />
              <strong>{data.latest.score ?? "NS"}</strong>
              <span>{data.movement.message}</span>
            </div>
          </div>
          <div className="history-movement-grid">
            <MetricCard label={LATEST_CHECK_LABEL} value={data.latest.score ?? "NS"} helper={formatDateTime(data.latest.run_at)} />
            <MetricCard
              label="Previous check"
              value={data.movement.previousScore == null ? "Not available" : String(data.movement.previousScore)}
              helper={data.movement.bandMessage ?? "No previous band movement available."}
            />
            <MetricCard
              label="Recommended limit"
              value={formatHistoryMoney(data.latest.recommended_limit, data.latest.currency)}
              helper={`Confidence: ${formatHistoryValue(data.latest.confidence_level)}`}
            />
          </div>
        </Card>
      ) : (
        <div className="empty-state">No score runs are available yet. Open the company profile to run the latest CreditShark check.</div>
      )}

      {data.rows.length > 1 ? <ScoreTrend rows={data.rows.slice(0, 8).reverse()} /> : null}

      <Card className="tab-section">
        <SectionHeader title="Historical score runs" action={<Badge>{data.rows.length} checks</Badge>} />
        <ActionGroup className="compact-action-group compact-action-group--left" compact>
          <ButtonLink variant="secondary" href={`/companies/${data.company.company_number}/score`}>View latest score</ButtonLink>
          <ButtonLink variant="secondary" href={`/companies/${data.company.company_number}/report`}>View report</ButtonLink>
          <ButtonLink variant="secondary" href={`/companies/${data.company.company_number}/decision`}>Record decision</ButtonLink>
        </ActionGroup>
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
      </Card>

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
    <Card className="tab-section">
      <SectionHeader title="Recent score trend" action={<Badge>Latest {rows.length} checks</Badge>} />
      <svg className="score-trend" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Recent score trend">
        <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
      </svg>
    </Card>
  );
}

function HistoryRow({ row, companyNumber, current }: { row: ScoreHistoryRow; companyNumber: string; current: boolean }) {
  const context = row.top_review_reason ?? row.top_positive_reason;
  return (
    <tr>
      <td>
        <strong>{formatDateTime(row.run_at)}</strong>
        {current ? <EvidenceChip sourceType="model" label="Latest check" /> : <Badge>History</Badge>}
      </td>
      <td>{row.score ?? "NS"}</td>
      <td><RiskBadge riskBand={row.risk_band} /></td>
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
