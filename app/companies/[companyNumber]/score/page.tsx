import type { Metadata } from "next";
import Link from "next/link";
import { CREDITSHARK_PRODUCT_GUARDRAIL } from "../../../../src/lib/guardrails";
import { getLatestScoreRunForCompany, type ScoreRunResult } from "../../../../src/lib/scoring/scoring-service";
import type { ScoreReasonCode } from "../../../../src/types/creditshark";

export const metadata: Metadata = {
  title: "Score explanation"
};

export const dynamic = "force-dynamic";

export default async function CompanyScorePage({ params }: { params: Promise<{ companyNumber: string }> }) {
  const { companyNumber } = await params;
  const result = await getLatestScoreRunForCompany(companyNumber);

  if (!result.ok) {
    return <ScoreEmptyState companyNumber={companyNumber} message={result.error.message} />;
  }

  return <ScoreExplanation data={result.data} />;
}

function ScoreExplanation({ data }: { data: ScoreRunResult }) {
  const groupedReasons = groupReasonsByGroup(data.reasonCodes);
  const manualReasons = data.reasonCodes.filter((reason) => reason.group === "manual_adverse_events");

  return (
    <section className="page-shell">
      <div className="profile-header">
        <div>
          <p className="eyebrow">Score explanation</p>
          <h1 className="page-title">{data.company.company_name}</h1>
          <p className="lede">
            Source-linked advisory score for Companies House snapshot {data.snapshot.id}.
          </p>
        </div>
        <div className="profile-actions">
          <Link className="button-secondary" href={`/companies/${data.company.company_number}`}>
            Back to profile
          </Link>
          <Link className="button-primary" href={`/companies/${data.company.company_number}`}>
            Refresh snapshot and rerun score
          </Link>
        </div>
      </div>

      <div className="score-explanation-grid">
        <section className="card score-summary-card">
          <div className="score-hero">
            <div>
              <span className={`risk-badge risk-badge--${data.scoreRun.riskBand}`}>{formatRiskBand(data.scoreRun.riskBand)}</span>
              <h2>Advisory score</h2>
            </div>
            <div className="score-value">{data.scoreRun.score ?? "NS"}</div>
          </div>
          <dl className="detail-grid">
            <Detail label="Company number" value={data.company.company_number} />
            <Detail label="Confidence" value={formatValue(data.scoreRun.confidenceLevel)} />
            <Detail label="Recommended limit" value={formatMoney(data.scoreRun.recommendedLimit, data.scoreRun.currency)} />
            <Detail label="Model version" value={data.modelVersion.version} />
            <Detail label="Source fetched" value={formatDateTime(data.snapshot.source_fetched_at)} />
            <Detail label="Score run" value={formatDateTime(data.scoreRun.runAt)} />
          </dl>
        </section>

        <aside className="card ocean-card">
          <p className="eyebrow">Advisory limitations</p>
          <p className="note">{CREDITSHARK_PRODUCT_GUARDRAIL}</p>
          <div className="disabled-actions">
            <Link className="button-secondary" href={`/companies/${data.company.company_number}/adverse`}>
              Review manual adverse events
            </Link>
            <span aria-disabled="true" className="button-secondary disabled-button">
              Export report coming later
            </span>
          </div>
        </aside>
      </div>

      {manualReasons.length > 0 ? (
        <div className="warning-note">
          Manual adverse data influenced this score. Review the source note before extending material credit.
        </div>
      ) : null}

      <section className="card score-section">
        <div className="section-heading">
          <h2>Factor group breakdown</h2>
          <span className="badge">{data.reasonCodes.length} reason codes</span>
        </div>
        <div className="factor-groups">
          {Array.from(groupedReasons.entries()).map(([group, reasons]) => (
            <div className="factor-group" key={group}>
              <h3>{formatGroup(group)}</h3>
              <div className="reason-list">
                {reasons.map((reason) => <ReasonRow key={reason.code} reason={reason} />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card score-section">
        <div className="section-heading">
          <h2>Missing data</h2>
          <span className="badge">Confidence: {formatValue(data.scoreRun.confidenceLevel)}</span>
        </div>
        {data.missingDataFlags.length > 0 ? (
          <ul className="flag-list">
            {data.missingDataFlags.map((flag) => <li key={flag}>{flag}</li>)}
          </ul>
        ) : (
          <p className="note">No missing-data flags were emitted for this score run.</p>
        )}
        <p className="note">Missing data reduces confidence where the scoring model cannot inspect a source section or structured metric.</p>
      </section>
    </section>
  );
}

function ScoreEmptyState({ companyNumber, message }: { companyNumber: string; message: string }) {
  return (
    <section className="page-shell">
      <div className="placeholder-stack">
        <p className="eyebrow">Score explanation</p>
        <h1 className="page-title">No score run available</h1>
        <div className="empty-state">
          <strong>{companyNumber}</strong>
          <div>{message}</div>
        </div>
        <div className="actions">
          <Link className="button-primary" href={`/companies/${companyNumber}`}>
            Back to profile
          </Link>
        </div>
      </div>
    </section>
  );
}

function ReasonRow({ reason }: { reason: ScoreReasonCode }) {
  return (
    <article className={`reason-row reason-row--${reason.direction}`}>
      <div>
        <div className="reason-row__title">
          <span>{reason.label}</span>
          <span className={`source-chip source-chip--${reason.direction}`}>{reason.sourceType}</span>
        </div>
        <p>{reason.explanation}</p>
        <div className="reason-row__meta">
          <span>Code: {reason.code}</span>
          <span>Source date: {formatDate(reason.sourceDate)}</span>
          {reason.sourceId ? <span>Source id: {reason.sourceId}</span> : null}
        </div>
      </div>
      <div className="reason-impact">
        <strong>{formatSignedNumber(reason.weight)}</strong>
        <span>{reason.impact}</span>
      </div>
    </article>
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

function groupReasonsByGroup(reasons: ScoreReasonCode[]): Map<string, ScoreReasonCode[]> {
  return reasons.reduce((groups, reason) => {
    const existing = groups.get(reason.group) ?? [];
    existing.push(reason);
    groups.set(reason.group, existing);
    return groups;
  }, new Map<string, ScoreReasonCode[]>());
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

function formatGroup(value: string): string {
  return value.replace(/_/g, " ");
}

function formatSignedNumber(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}
