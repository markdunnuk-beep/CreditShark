import type { Metadata } from "next";
import Link from "next/link";
import { CREDITSHARK_PRODUCT_GUARDRAIL } from "../../../../src/lib/guardrails";
import {
  DECISION_RECORD_VALUES,
  formatDecisionLabel,
  formatDecisionMoney,
  getDecisionWorkflowForCompany,
  type DecisionRecord,
  type DecisionWorkflowData
} from "../../../../src/lib/decisions/decision-service";
import { createDecisionRecordAction } from "./actions";

export const metadata: Metadata = {
  title: "Record decision"
};

export const dynamic = "force-dynamic";

export default async function CompanyDecisionPage({
  params,
  searchParams
}: {
  params: Promise<{ companyNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { companyNumber } = await params;
  const notices = await searchParams;
  const result = await getDecisionWorkflowForCompany(companyNumber);

  if (!result.ok) {
    return <DecisionError companyNumber={companyNumber} message={result.error.message} />;
  }

  return <DecisionWorkflow data={result.data} notices={notices} />;
}

function DecisionWorkflow({ data, notices }: { data: DecisionWorkflowData; notices: Record<string, string | string[] | undefined> }) {
  const createAction = createDecisionRecordAction.bind(null, data.company.company_number);
  const recommendationLimit = data.recommendation?.recommended_limit ?? data.scoreRun.recommended_limit;

  return (
    <section className="page-shell">
      <div className="profile-header">
        <div>
          <p className="eyebrow">User-recorded decision</p>
          <h1 className="page-title">{data.company.company_name}</h1>
          <p className="lede">
            Record the commercial credit outcome your team chooses, linked to the latest advisory score, recommendation and snapshot.
          </p>
        </div>
        <div className="profile-actions">
          <Link className="button-secondary" href={`/companies/${data.company.company_number}`}>
            Back to profile
          </Link>
          <Link className="button-secondary" href={`/companies/${data.company.company_number}/score`}>
            Score explanation
          </Link>
        </div>
      </div>

      <Notice notices={notices} />

      <div className="status-note status-note--compact">{CREDITSHARK_PRODUCT_GUARDRAIL}</div>

      <div className="decision-record-grid">
        <section className="card score-summary-card decision-summary-panel">
          <div className="section-heading">
            <h2>Current advisory recommendation</h2>
            <span className={`risk-badge risk-badge--${data.scoreRun.risk_band}`}>{formatRiskBand(data.scoreRun.risk_band)}</span>
          </div>
          <dl className="detail-grid">
            <Detail label="Company number" value={data.company.company_number} />
            <Detail label="Advisory score" value={data.scoreRun.score == null ? "Not scored" : String(data.scoreRun.score)} />
            <Detail label="Confidence" value={formatValue(data.scoreRun.confidence_level)} />
            <Detail label="Recommended limit" value={formatDecisionMoney(recommendationLimit, data.scoreRun.currency)} />
            <Detail label="Model version" value={data.modelVersion.version} />
            <Detail label="Score run" value={formatDateTime(data.scoreRun.run_at)} />
          </dl>
          <p className="note">
            Decision linked to advisory score run <span className="secondary-id">{data.scoreRun.id}</span> and snapshot <span className="secondary-id">{data.snapshot.id}</span>.
          </p>
          <div className="action-bar">
            <Link className="button-secondary" href={`/companies/${data.company.company_number}/score`}>
              Review score evidence
            </Link>
            <Link className="button-secondary" href={`/companies/${data.company.company_number}/report`}>
              View report
            </Link>
          </div>
        </section>

        <aside className="card ocean-card">
          <p className="eyebrow">Decision boundary</p>
          <p className="note">
            CreditShark does not approve, decline, lend, broker credit or make regulated ratings. This page records a user-made commercial decision and preserves the evidence link.
          </p>
          {data.latestDecision ? <LatestDecisionCompact decision={data.latestDecision} /> : <p className="empty-state">No decision has been recorded for this company yet.</p>}
        </aside>
      </div>

      <section className="card score-section">
        <div className="section-heading">
          <h2>Record commercial decision</h2>
          <span className="badge">Audit logged</span>
        </div>
        <DecisionForm action={createAction} />
      </section>

      <section className="card score-section">
        <div className="section-heading">
          <h2>Decision history</h2>
          <span className="badge">{data.decisionHistory.length} records</span>
        </div>
        {data.decisionHistory.length > 0 ? (
          <div className="decision-history-list">
            {data.decisionHistory.map((decision) => <DecisionHistoryCard key={decision.id} decision={decision} />)}
          </div>
        ) : (
          <div className="empty-state">No previous user-recorded decisions are attached to this company.</div>
        )}
      </section>
    </section>
  );
}

function DecisionForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  return (
    <form action={action} className="manual-event-form decision-record-form">
      <fieldset className="form-fieldset">
        <legend>Decision outcome</legend>
        <label>
          <span className="form-label">Decision option</span>
          <select name="decision" required defaultValue="refer_for_review">
            {DECISION_RECORD_VALUES.map((value) => <option key={value} value={value}>{formatDecisionLabel(value)}</option>)}
          </select>
        </label>
        <p className="form-help">Choose the outcome your team is recording. This is not an automated CreditShark decision.</p>
      </fieldset>
      <fieldset className="form-fieldset">
        <legend>Limits</legend>
        <label>
          <span className="form-label">Requested limit</span>
          <input name="requested_limit" inputMode="decimal" placeholder="Optional" />
        </label>
        <label>
          <span className="form-label">Final approved limit</span>
          <input name="approved_limit" inputMode="decimal" placeholder="Required for approval" />
        </label>
        <label>
          <span className="form-label">Currency</span>
          <input name="currency" maxLength={3} defaultValue="GBP" />
        </label>
      </fieldset>
      <fieldset className="form-fieldset form-span-2">
        <legend>Review notes</legend>
        <label>
          <span className="form-label">Reviewer notes</span>
          <textarea name="reviewer_notes" required minLength={8} rows={4} placeholder="Summarise the commercial rationale and any evidence reviewed." />
        </label>
        <label>
          <span className="form-label">Override reason</span>
          <textarea name="override_reason" rows={3} placeholder="Required when going outside the advisory recommendation." />
        </label>
        <p className="form-help">
          Override reasons are required when the approved limit exceeds the recommendation, when approving a high-risk or not-scored case, or when approving a limit without a recommendation.
        </p>
      </fieldset>
      <button className="button-primary" type="submit">Record decision</button>
    </form>
  );
}

function LatestDecisionCompact({ decision }: { decision: DecisionRecord }) {
  return (
    <div className="latest-decision-compact">
      <span className="badge">Latest recorded decision</span>
      <strong>{formatDecisionLabel(decision.decision_value)}</strong>
      <span>{formatDateTime(decision.decided_at)}</span>
    </div>
  );
}

function DecisionHistoryCard({ decision }: { decision: DecisionRecord }) {
  return (
    <article className="decision-history-card">
      <div className="manual-event-card__header">
        <div>
          <span className="badge">User-recorded</span>
          <h3>{formatDecisionLabel(decision.decision_value)}</h3>
        </div>
        <span className={`risk-badge risk-badge--${decision.risk_band ?? "not_scored"}`}>{formatRiskBand(decision.risk_band ?? "not_scored")}</span>
      </div>
      <dl className="detail-grid">
        <Detail label="Requested limit" value={formatDecisionMoney(decision.requested_limit, decision.currency)} />
        <Detail label="Recommended limit" value={formatDecisionMoney(decision.recommended_limit, decision.currency)} />
        <Detail label="Final approved limit" value={formatDecisionMoney(decision.approved_limit, decision.currency)} />
        <Detail label="Decided" value={formatDateTime(decision.decided_at)} />
      </dl>
      <p className="manual-source-note"><strong>Reviewer notes:</strong> {summarise(decision.reviewer_notes)}</p>
      {decision.override_reason ? <p className="warning-note"><strong>Override reason:</strong> {decision.override_reason}</p> : null}
      <div className="reason-row__meta">
        <span>Decision id: {decision.id}</span>
        <span>Score run id: {decision.score_run_id}</span>
      </div>
    </article>
  );
}

function Notice({ notices }: { notices: Record<string, string | string[] | undefined> }) {
  if (notices.created) return <div className="status-note">Decision record added and linked to the latest advisory score run.</div>;
  if (notices.error) return <div className="error-note" role="alert">{Array.isArray(notices.error) ? notices.error[0] : notices.error}</div>;
  return null;
}

function DecisionError({ companyNumber, message }: { companyNumber: string; message: string }) {
  return (
    <section className="page-shell">
      <div className="placeholder-stack">
        <p className="eyebrow">User-recorded decision</p>
        <h1 className="page-title">Decision workflow unavailable</h1>
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

function formatValue(value: string): string {
  return value.replace(/_/g, " ");
}

function formatRiskBand(value: string): string {
  return value.replace(/_/g, " ");
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function summarise(value: string): string {
  return value.length > 220 ? `${value.slice(0, 217)}...` : value;
}
