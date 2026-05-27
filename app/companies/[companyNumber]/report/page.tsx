import type { Metadata } from "next";
import Link from "next/link";
import {
  ADVISORY_SCORE_LABEL,
  COMPANIES_HOUSE_EVIDENCE_LABEL,
  CREDITSHARK_REPORT_LIMITATIONS,
  MANUAL_DATA_INCLUDED_LABEL,
  USER_RECORDED_DECISION_LABEL
} from "../../../../src/lib/guardrails";
import {
  getLatestReportDataForCompany,
  type ReportCharge,
  type ReportFiling,
  type ReportViewModel
} from "../../../../src/lib/reports/report-service";
import { formatDecisionLabel, formatDecisionMoney } from "../../../../src/lib/decisions/decision-service";
import type { ManualAdverseEventRecord } from "../../../../src/lib/adverse/manual-adverse-event-service";
import type { ScoreReasonCode } from "../../../../src/types/creditshark";
import { createReportExportAction } from "./actions";
import { PrintButton } from "./PrintButton";
import {
  ActionGroup,
  Button,
  ButtonLink,
  Notice as UiNotice,
  ReportSection,
  RiskBadge
} from "../../../components/ui";

export const metadata: Metadata = {
  title: "Trade-risk report"
};

export const dynamic = "force-dynamic";

export default async function CompanyReportPage({
  params,
  searchParams
}: {
  params: Promise<{ companyNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { companyNumber } = await params;
  const query = await searchParams;
  const exportId = singleValue(query.exportId);
  const result = await getLatestReportDataForCompany(companyNumber, exportId);

  if (!result.ok) {
    return <ReportEmptyState companyNumber={companyNumber} message={result.error.message} />;
  }

  return <ReportPreview data={result.data} notice={query} />;
}

function ReportPreview({ data, notice }: { data: ReportViewModel; notice: Record<string, string | string[] | undefined> }) {
  const createAction = createReportExportAction.bind(null, data.company.company_number);
  const groupedReasons = groupReasonsByGroup(data.reasonCodes);

  return (
    <section className="report-page-shell">
      <div className="report-controls">
        <div>
          <p className="eyebrow">Reports & decisions</p>
          <h1 className="page-title">Report preview</h1>
          <p className="lede">Preview the standalone advisory report before recording an export and printing.</p>
        </div>
        <ActionGroup align="end" className="profile-actions">
          <ButtonLink variant="secondary" href={`/companies/${data.company.company_number}/decision`}>
            Record decision
          </ButtonLink>
          <ButtonLink variant="secondary" href={`/companies/${data.company.company_number}/score`}>
            Score evidence
          </ButtonLink>
          <form action={createAction}>
            <Button type="submit">Record export and print report</Button>
          </form>
          <PrintButton />
        </ActionGroup>
      </div>

      <div className="in-tab-switch" aria-label="Reports and decisions">
        <Link aria-current="page" href={`/companies/${data.company.company_number}/report`}>Report preview</Link>
        <Link href={`/companies/${data.company.company_number}/decision`}>Record decision</Link>
      </div>

      <Notice notice={notice} exportId={data.exportRecord?.id ?? null} />

      <article className="report-document">
        <ReportSection className="report-cover">
          <div className="report-cover__top">
            <div>
              <div className="report-wordmark">CreditShark</div>
              <p className="eyebrow">Advisory company screening</p>
              <h2>Trade-risk report</h2>
              <p>{data.company.company_name}</p>
            </div>
            <RiskBadge riskBand={data.scoreRun.risk_band} />
          </div>
          <div className="report-cover__summary">
            <ReportMetric label={ADVISORY_SCORE_LABEL} value={data.scoreRun.score == null ? "Not scored" : String(data.scoreRun.score)} />
            <ReportMetric label="Recommended limit" value={formatMoney(Number(data.scoreRun.recommended_limit), data.scoreRun.currency)} />
            <ReportMetric label="Confidence" value={formatValue(data.scoreRun.confidence_level)} />
          </div>
          <dl className="report-kv-grid">
            <ReportDetail label="Company number" value={data.company.company_number} />
            <ReportDetail label="Company status" value={formatValue(data.company.company_status)} />
            <ReportDetail label="Generated" value={formatDateTime(data.generatedAt)} />
            <ReportDetail label="Snapshot timestamp" value={formatDateTime(data.snapshot.source_fetched_at)} />
            <ReportDetail label="Score run timestamp" value={formatDateTime(data.scoreRun.run_at)} />
            <ReportDetail label="Report export id" value={data.exportRecord?.id ?? "Not recorded yet"} />
            <ReportDetail label="Linked decision id" value={data.exportRecord?.decision_record_id ?? data.latestDecision?.id ?? "Not recorded yet"} />
          </dl>
        </ReportSection>

        <ReportSection title="Recommendation summary" meta={<RiskBadge riskBand={data.scoreRun.risk_band} />}>
          <div className="report-summary-grid">
            <ReportMetric label="Model version" value={data.modelVersion.version} />
            <ReportMetric label="Snapshot timestamp" value={formatDateTime(data.snapshot.source_fetched_at)} />
            <ReportMetric label="Score run timestamp" value={formatDateTime(data.scoreRun.run_at)} />
          </div>
          {data.summaries.hasManualData ? (
            <p className="report-warning">{MANUAL_DATA_INCLUDED_LABEL}: manual entries are shown separately from Companies House evidence.</p>
          ) : null}
          {data.scoreRun.missing_data_flags_json.length > 0 ? (
            <p className="report-warning">Missing data flags: {data.scoreRun.missing_data_flags_json.join(", ")}.</p>
          ) : null}
          <ReasonSummary title="Top positive reasons" reasons={data.summaries.topPositiveReasons} />
          <ReasonSummary title="Top negative reasons" reasons={data.summaries.topNegativeReasons} />
        </ReportSection>

        <ReportSection title="Score history context">
          {data.scoreHistoryMovement ? (
            <>
              <dl className="report-kv-grid">
                <ReportDetail label="Latest score" value={data.scoreHistoryMovement.latestScore == null ? "Not scored" : String(data.scoreHistoryMovement.latestScore)} />
                <ReportDetail label="Previous score" value={data.scoreHistoryMovement.previousScore == null ? "Not available" : String(data.scoreHistoryMovement.previousScore)} />
                <ReportDetail label="Movement" value={data.scoreHistoryMovement.message} />
              </dl>
              {data.scoreHistoryMovement.bandMessage ? <p className="note">{data.scoreHistoryMovement.bandMessage}</p> : null}
              <p className="note">Full score history is available in the app. Historical rows are prior CreditShark checks, not the current risk view.</p>
            </>
          ) : (
            <p className="note">Score history context is not available for this report preview.</p>
          )}
        </ReportSection>

        <ReportSection title="Latest recorded commercial decision">
          {data.latestDecision ? (
            <>
              <p className="report-disclaimer report-disclaimer--compact">
                {USER_RECORDED_DECISION_LABEL}: the user records any commercial decision. CreditShark provides advisory support only.
              </p>
              <dl className="report-kv-grid">
                <ReportDetail label="Recorded decision" value={formatDecisionLabel(data.latestDecision.decision_value)} />
                <ReportDetail label="Requested limit" value={formatDecisionMoney(data.latestDecision.requested_limit, data.latestDecision.currency)} />
                <ReportDetail label="Recommended limit" value={formatDecisionMoney(data.latestDecision.recommended_limit, data.latestDecision.currency)} />
                <ReportDetail label="Final approved limit" value={formatDecisionMoney(data.latestDecision.approved_limit, data.latestDecision.currency)} />
                <ReportDetail label="Decided timestamp" value={formatDateTime(data.latestDecision.decided_at)} />
                <ReportDetail label="Linked score run" value={data.latestDecision.score_run_id} />
              </dl>
              <p className="manual-source-note"><strong>Reviewer notes:</strong> {summarise(data.latestDecision.reviewer_notes)}</p>
              {data.latestDecision.override_reason ? <p className="report-warning"><strong>Override reason:</strong> {data.latestDecision.override_reason}</p> : null}
            </>
          ) : (
            <p className="note">No user-recorded decision is attached to this company yet.</p>
          )}
        </ReportSection>

        <ReportSection title="Company identity">
          <dl className="report-kv-grid">
            <ReportDetail label="Company name" value={data.company.company_name} />
            <ReportDetail label="Company number" value={data.company.company_number} />
            <ReportDetail label="Company type" value={formatValue(data.company.company_type)} />
            <ReportDetail label="Jurisdiction" value={formatValue(data.company.jurisdiction)} />
            <ReportDetail label="Postcode" value={formatValue(data.company.registered_office_postcode)} />
            <ReportDetail label="Locality" value={formatValue(data.snapshot.raw_profile_json?.registered_office_address?.locality)} />
            <ReportDetail label="Incorporated" value={formatDate(data.company.incorporated_on)} />
            <ReportDetail label="Company age" value={formatAge(data.snapshot.derived_company_age_months)} />
            <ReportDetail label="Latest accounts" value={formatDate(data.snapshot.latest_accounts_date)} />
            <ReportDetail label="Latest confirmation statement" value={formatDate(data.snapshot.latest_confirmation_statement_date)} />
          </dl>
          <span className="source-chip source-chip--companies-house">{COMPANIES_HOUSE_EVIDENCE_LABEL}</span>
        </ReportSection>

        <ReportSection title="Filing and accounts evidence">
          <dl className="report-kv-grid">
            <ReportDetail label="Filing records captured" value={String(data.filings.length)} />
            <ReportDetail label="Latest filing date" value={formatDate(data.summaries.latestFilingDate)} />
            <ReportDetail label="Latest accounts date" value={formatDate(data.snapshot.latest_accounts_date)} />
            <ReportDetail label="Source timestamp" value={formatDateTime(data.snapshot.source_fetched_at)} />
          </dl>
          <p className="note">Structured financial extraction is not yet available, so financial strength is limited to available filing metadata and missing-data reason codes.</p>
          <MiniFilingTable filings={data.filings.slice(0, 5)} />
        </ReportSection>

        <ReportSection title="Charges and adverse events">
          <dl className="report-kv-grid">
            <ReportDetail label="Active charges" value={String(data.summaries.activeCharges)} />
            <ReportDetail label="Satisfied charges" value={String(data.summaries.satisfiedCharges)} />
            <ReportDetail label="Latest charge date" value={formatDate(data.summaries.latestChargeDate)} />
            <ReportDetail label="Active manual events" value={String(data.activeManualEvents.length)} />
            <ReportDetail label="Inactive/superseded manual events" value={String(data.inactiveManualEventCount)} />
          </dl>
          <p className="report-warning">{MANUAL_DATA_INCLUDED_LABEL}: manual entries are shown separately from Companies House evidence.</p>
          <MiniChargeTable charges={data.charges.slice(0, 5)} />
          <ManualEvents events={data.activeManualEvents} />
        </ReportSection>

        <ReportSection title="Directors and PSC summary">
          <dl className="report-kv-grid">
            <ReportDetail label="Current officers" value={String(data.officerSummary.current)} />
            <ReportDetail label="Officer records captured" value={String(data.officerSummary.total)} />
            <ReportDetail label="Active PSC records" value={String(data.pscSummary.active)} />
            <ReportDetail label="PSC records captured" value={String(data.pscSummary.total)} />
          </dl>
          <p className="note">This is light-touch governance context only. CreditShark does not infer personal creditworthiness from officers or PSCs.</p>
        </ReportSection>

        <ReportSection title="Reason-code detail">
          <div className="report-reason-groups">
            {Array.from(groupedReasons.entries()).map(([group, reasons]) => (
              <div className="report-reason-group" key={group}>
                <h3>{formatGroup(group)}</h3>
                {reasons.map((reason) => <ReportReasonRow key={reason.code} reason={reason} />)}
              </div>
            ))}
          </div>
        </ReportSection>

        <ReportSection title="Audit and limitations">
          <dl className="report-kv-grid">
            <ReportDetail label="Snapshot id" value={data.snapshot.id} />
            <ReportDetail label="Score run id" value={data.scoreRun.id} />
            <ReportDetail label="Model version" value={data.modelVersion.version} />
            <ReportDetail label="Generated" value={formatDateTime(data.generatedAt)} />
            <ReportDetail label="Source timestamp" value={formatDateTime(data.snapshot.source_fetched_at)} />
            <ReportDetail label="Export recorded" value={data.exportRecord ? formatDateTime(data.exportRecord.exported_at) : "Not recorded yet"} />
          </dl>
          <p className="report-disclaimer report-disclaimer--compact">{CREDITSHARK_REPORT_LIMITATIONS}</p>
          <p className="note">This report uses public Companies House evidence, user-entered manual data where present, and transparent rule-based scoring. Missing data is shown rather than hidden.</p>
        </ReportSection>
      </article>
    </section>
  );
}

function ReportEmptyState({ companyNumber, message }: { companyNumber: string; message: string }) {
  return (
    <section className="page-shell">
      <div className="placeholder-stack">
        <p className="eyebrow">Trade-risk report</p>
        <h1 className="page-title">Report is not ready</h1>
        <div className="empty-state">
          <strong>{companyNumber}</strong>
          <div>{message}</div>
        </div>
        <Link className="button-primary" href={`/companies/${companyNumber}`}>
          Open company profile
        </Link>
      </div>
    </section>
  );
}

function Notice({ notice, exportId }: { notice: Record<string, string | string[] | undefined>; exportId: string | null }) {
  if (notice.exported) {
    return <UiNotice className="report-screen-only" variant="success" title="Export recorded">Export id: {exportId ?? singleValue(notice.exportId) ?? "Recorded"}. You can now print or save this preview as PDF.</UiNotice>;
  }
  if (notice.error) return <UiNotice className="report-screen-only" variant="error">{singleValue(notice.error)}</UiNotice>;
  return <UiNotice className="report-screen-only" variant="report" title="Preview only">Record the export before printing or saving as PDF so the audit trail captures this report context.</UiNotice>;
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="report-metric">
      <div>{label}</div>
      <strong>{value}</strong>
    </div>
  );
}

function ReportDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ReasonSummary({ title, reasons }: { title: string; reasons: ScoreReasonCode[] }) {
  return reasons.length > 0 ? (
    <div className="report-reason-summary">
      <h3>{title}</h3>
      <ul>
        {reasons.map((reason) => <li key={reason.code}>{reason.label}</li>)}
      </ul>
    </div>
  ) : null;
}

function MiniFilingTable({ filings }: { filings: ReportFiling[] }) {
  return filings.length > 0 ? (
    <table className="report-table">
      <thead><tr><th>Date</th><th>Type</th><th>Description</th></tr></thead>
      <tbody>{filings.map((filing) => <tr key={filing.id}><td>{formatDate(filing.filing_date)}</td><td>{formatValue(filing.filing_type)}</td><td>{formatValue(filing.description)}</td></tr>)}</tbody>
    </table>
  ) : <p className="note">No filing rows were captured for this snapshot.</p>;
}

function MiniChargeTable({ charges }: { charges: ReportCharge[] }) {
  return charges.length > 0 ? (
    <table className="report-table">
      <thead><tr><th>Created</th><th>Status</th><th>Classification</th></tr></thead>
      <tbody>{charges.map((charge) => <tr key={charge.id}><td>{formatDate(charge.created_on)}</td><td>{formatValue(charge.status)}</td><td>{formatValue(charge.classification)}</td></tr>)}</tbody>
    </table>
  ) : <p className="note">No charge rows were captured for this snapshot.</p>;
}

function ManualEvents({ events }: { events: ManualAdverseEventRecord[] }) {
  return events.length > 0 ? (
    <div className="report-manual-events">
      {events.map((event) => (
        <div className="report-manual-event" key={event.id}>
          <span className="badge manual-badge">Manual data</span>
          <strong>{formatGroup(event.event_type)} - {formatValue(event.status)}</strong>
          <p>{event.source_note}</p>
          <small>Event date: {formatDate(event.event_date)}. Evidence reference: {event.evidence_reference || "Not provided"}.</small>
        </div>
      ))}
    </div>
  ) : <p className="note">No active manual adverse events are attached to this report.</p>;
}

function ReportReasonRow({ reason }: { reason: ScoreReasonCode }) {
  return (
    <div className={`report-reason-row report-reason-row--${reason.direction}`}>
      <div>
        <strong>{reason.label}</strong>
        <p>{reason.explanation}</p>
        <small>{reason.code} | {formatValue(reason.sourceType)} | {formatDate(reason.sourceDate)}</small>
      </div>
      <div className="reason-impact">
        <strong>{formatSignedNumber(reason.weight)}</strong>
        <span>{reason.impact}</span>
      </div>
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

function singleValue(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatValue(value: string | null | undefined): string {
  return value ? value.replace(/[_-]/g, " ") : "Not available";
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not available";
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

function formatAge(months: number | null): string {
  if (months == null) return "Not available";
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} month${remainingMonths === 1 ? "" : "s"}`;
  return `${years} year${years === 1 ? "" : "s"} ${remainingMonths} month${remainingMonths === 1 ? "" : "s"}`;
}

function summarise(value: string): string {
  return value.length > 260 ? `${value.slice(0, 257)}...` : value;
}
