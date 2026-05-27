import type { Metadata } from "next";
import Link from "next/link";
import { ADVISORY_SCORE_LABEL, USER_RECORDED_DECISION_LABEL } from "../../../../src/lib/guardrails";
import {
  DECISION_RECORD_VALUES,
  formatDecisionLabel,
  formatDecisionMoney,
  getDecisionWorkflowForCompany,
  type DecisionRecord,
  type DecisionWorkflowData
} from "../../../../src/lib/decisions/decision-service";
import { createDecisionRecordAction } from "./actions";
import {
  Badge,
  Button,
  Card,
  DetailList,
  EvidencePanel,
  Field,
  FormActions,
  FormSection,
  Notice as UiNotice,
  RiskBadge,
  Select,
  SectionHeader,
  Textarea,
  TextInput
} from "../../../components/ui";

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
    <section className="company-tab-page">
      <Notice notices={notices} />

      <div className="in-tab-switch" aria-label="Reports and decisions">
        <Link href={`/companies/${data.company.company_number}/report`}>Report preview</Link>
        <Link aria-current="page" href={`/companies/${data.company.company_number}/decision`}>Record decision</Link>
      </div>

      <div className="decision-record-grid">
        <Card className="tab-section">
          <SectionHeader title="Current advisory recommendation" action={<RiskBadge riskBand={data.scoreRun.risk_band} />} />
          <DetailList items={[
            { label: ADVISORY_SCORE_LABEL, value: data.scoreRun.score == null ? "Not scored" : String(data.scoreRun.score) },
            { label: "Confidence", value: formatValue(data.scoreRun.confidence_level) },
            { label: "Recommended limit", value: formatDecisionMoney(recommendationLimit, data.scoreRun.currency) },
            { label: "Model version", value: data.modelVersion.version },
            { label: "Score run", value: formatDateTime(data.scoreRun.run_at) }
          ]} />
          <details className="secondary-audit-details secondary-audit-details--plain">
            <summary>Linked audit details</summary>
            <DetailList compact items={[
              { label: "Score run id", value: data.scoreRun.id },
              { label: "Snapshot id", value: data.snapshot.id }
            ]} />
          </details>
        </Card>

        <EvidencePanel className="ocean-card" title={USER_RECORDED_DECISION_LABEL} variant="decision">
          <p className="eyebrow">{USER_RECORDED_DECISION_LABEL}</p>
          <p className="note">The user records any commercial decision. CreditShark provides advisory support only.</p>
          {data.latestDecision ? <LatestDecisionCompact decision={data.latestDecision} /> : <p className="empty-state">No decision has been recorded for this company yet.</p>}
        </EvidencePanel>
      </div>

      <Card className="tab-section">
        <SectionHeader title="Record commercial decision" action={<Badge>Audit logged</Badge>} />
        <DecisionForm action={createAction} />
      </Card>

      <Card className="tab-section">
        <SectionHeader title="Decision history" action={<Badge>{data.decisionHistory.length} records</Badge>} />
        {data.decisionHistory.length > 0 ? (
          <div className="decision-history-list">
            {data.decisionHistory.map((decision) => <DecisionHistoryCard key={decision.id} decision={decision} />)}
          </div>
        ) : (
          <div className="empty-state">No previous user-recorded decisions are attached to this company.</div>
        )}
      </Card>
    </section>
  );
}

function DecisionForm({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  return (
    <form action={action} className="manual-event-form decision-record-form">
      <FormSection title="Decision outcome" description="Record the commercial outcome your team is choosing.">
        <Field label="Decision option" helper="This is a user-recorded outcome, not an automated CreditShark decision.">
          <Select name="decision" required defaultValue="refer_for_review">
            {DECISION_RECORD_VALUES.map((value) => <option key={value} value={value}>{formatDecisionLabel(value)}</option>)}
          </Select>
        </Field>
        <p className="form-help">Choose the outcome your team is recording. This is not an automated CreditShark decision.</p>
      </FormSection>
      <FormSection title="Limits" description="Use whole-number trade limits where possible.">
        <Field label="Requested limit" helper="Optional requested trade limit.">
          <TextInput name="requested_limit" inputMode="decimal" placeholder="Optional" />
        </Field>
        <Field label="Final approved limit" helper="Required when recording an approval.">
          <TextInput name="approved_limit" inputMode="decimal" placeholder="Required for approval" />
        </Field>
        <Field label="Currency">
          <TextInput name="currency" maxLength={3} defaultValue="GBP" />
        </Field>
      </FormSection>
      <FormSection title="Review notes" description="Keep the rationale practical and evidence-led." span>
        <Field label="Reviewer notes" helper="Summarise the commercial rationale and any evidence reviewed.">
          <Textarea name="reviewer_notes" required minLength={8} rows={4} placeholder="Summarise the commercial rationale and any evidence reviewed." />
        </Field>
        <Field label="Override reason" helper="Use this when going outside the advisory recommendation.">
          <Textarea name="override_reason" rows={3} placeholder="Required when going outside the advisory recommendation." />
        </Field>
        <p className="form-help">
          Override reasons are required when the approved limit exceeds the recommendation, when approving a high-risk or not-scored case, or when approving a limit without a recommendation.
        </p>
      </FormSection>
      <FormActions>
        <Button type="submit">Record decision</Button>
      </FormActions>
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
        <RiskBadge riskBand={decision.risk_band ?? "not_scored"} />
      </div>
      <DetailList items={[
        { label: "Requested limit", value: formatDecisionMoney(decision.requested_limit, decision.currency) },
        { label: "Recommended limit", value: formatDecisionMoney(decision.recommended_limit, decision.currency) },
        { label: "Final approved limit", value: formatDecisionMoney(decision.approved_limit, decision.currency) },
        { label: "Decided", value: formatDateTime(decision.decided_at) }
      ]} />
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
  if (notices.created) return <UiNotice variant="success">Decision record added and linked to the latest advisory score run.</UiNotice>;
  if (notices.error) return <UiNotice variant="error">{Array.isArray(notices.error) ? notices.error[0] : notices.error}</UiNotice>;
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
