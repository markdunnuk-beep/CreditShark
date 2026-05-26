import type { Metadata } from "next";
import Link from "next/link";
import { CREDITSHARK_PRODUCT_GUARDRAIL } from "../../../../src/lib/guardrails";
import {
  getLatestReportDataForCompany,
  type ReportCharge,
  type ReportFiling,
  type ReportViewModel
} from "../../../../src/lib/reports/report-service";
import type { ManualAdverseEventRecord } from "../../../../src/lib/adverse/manual-adverse-event-service";
import type { ScoreReasonCode } from "../../../../src/types/creditshark";
import { createReportExportAction } from "./actions";
import { PrintButton } from "./PrintButton";

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
          <p className="eyebrow">Report preview</p>
          <h1 className="page-title">Trade-risk report preview</h1>
          <p className="lede">Print-optimised advisory report based on the latest persisted snapshot and score run.</p>
        </div>
        <div className="profile-actions">
          <Link className="button-secondary" href={`/companies/${data.company.company_number}`}>
            Back to profile
          </Link>
          <Link className="button-secondary" href={`/companies/${data.company.company_number}/score`}>
            Score explanation
          </Link>
          <form action={createAction}>
            <button className="button-primary" type="submit">Record export and print report</button>
          </form>
          <PrintButton />
        </div>
      </div>

      <Notice notice={notice} exportId={data.exportRecord?.id ?? null} />

      <article className="report-document">
        <section className="report-cover report-section">
          <div className="report-cover__top">
            <div>
              <div className="report-wordmark">CreditShark</div>
              <p className="eyebrow">Advisory company screening</p>
              <h2>Trade-risk report</h2>
              <p>{data.company.company_name}</p>
            </div>
            <span className={`risk-badge risk-badge--${data.scoreRun.risk_band}`}>{formatRiskBand(data.scoreRun.risk_band)}</span>
          </div>
          <div className="report-cover__summary">
            <ReportMetric label="Advisory score" value={data.scoreRun.score == null ? "Not scored" : String(data.scoreRun.score)} />
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
          </dl>
          <p className="report-disclaimer report-disclaimer--compact">{CREDITSHARK_PRODUCT_GUARDRAIL}</p>
        </section>

        <section className="report-section">
          <div className="report-section-heading">
            <h2>Recommendation summary</h2>
            <span className={`risk-badge risk-badge--${data.scoreRun.risk_band}`}>{formatRiskBand(data.scoreRun.risk_band)}</span>
          </div>
          <div className="report-summary-grid">
            <ReportMetric label="Model version" value={data.modelVersion.version} />
            <ReportMetric label="Snapshot timestamp" value={formatDateTime(data.snapshot.source_fetched_at)} />
            <ReportMetric label="Score run timestamp" value={formatDateTime(data.scoreRun.run_at)} />
          </div>
          {data.summaries.hasManualData ? (
            <p className="report-warning">Manual data is active for this company and has been labelled separately in this report.</p>
          ) : null}
          {data.scoreRun.missing_data_flags_json.length > 0 ? (
            <p className="report-warning">Missing data flags: {data.scoreRun.missing_data_flags_json.join(", ")}.</p>
          ) : null}
          <ReasonSummary title="Top positive reasons" reasons={data.summaries.topPositiveReasons} />
          <ReasonSummary title="Top negative reasons" reasons={data.summaries.topNegativeReasons} />
        </section>

        <section className="report-section">
          <h2>Company identity</h2>
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
          <span className="source-chip source-chip--companies-house">Companies House evidence</span>
        </section>

        <section className="report-section">
          <h2>Filing and accounts evidence</h2>
          <dl className="report-kv-grid">
            <ReportDetail label="Filing records captured" value={String(data.filings.length)} />
            <ReportDetail label="Latest filing date" value={formatDate(data.summaries.latestFilingDate)} />
            <ReportDetail label="Latest accounts date" value={formatDate(data.snapshot.latest_accounts_date)} />
            <ReportDetail label="Source timestamp" value={formatDateTime(data.snapshot.source_fetched_at)} />
          </dl>
          <p className="note">Structured financial extraction is not yet available, so financial strength is limited to available filing metadata and missing-data reason codes.</p>
          <MiniFilingTable filings={data.filings.slice(0, 5)} />
        </section>

        <section className="report-section">
          <h2>Charges and adverse events</h2>
          <dl className="report-kv-grid">
            <ReportDetail label="Active charges" value={String(data.summaries.activeCharges)} />
            <ReportDetail label="Satisfied charges" value={String(data.summaries.satisfiedCharges)} />
            <ReportDetail label="Latest charge date" value={formatDate(data.summaries.latestChargeDate)} />
            <ReportDetail label="Active manual events" value={String(data.activeManualEvents.length)} />
            <ReportDetail label="Inactive/superseded manual events" value={String(data.inactiveManualEventCount)} />
          </dl>
          <p className="report-warning">Manual adverse data is user-entered and is not verified registry data unless a verified source is later integrated.</p>
          <MiniChargeTable charges={data.charges.slice(0, 5)} />
          <ManualEvents events={data.activeManualEvents} />
        </section>

        <section className="report-section">
          <h2>Directors and PSC summary</h2>
          <dl className="report-kv-grid">
            <ReportDetail label="Current officers" value={String(data.officerSummary.current)} />
            <ReportDetail label="Officer records captured" value={String(data.officerSummary.total)} />
            <ReportDetail label="Active PSC records" value={String(data.pscSummary.active)} />
            <ReportDetail label="PSC records captured" value={String(data.pscSummary.total)} />
          </dl>
          <p className="note">This is light-touch governance context only. CreditShark does not infer personal creditworthiness from officers or PSCs.</p>
        </section>

        <section className="report-section">
          <h2>Reason-code detail</h2>
          <div className="report-reason-groups">
            {Array.from(groupedReasons.entries()).map(([group, reasons]) => (
              <div className="report-reason-group" key={group}>
                <h3>{formatGroup(group)}</h3>
                {reasons.map((reason) => <ReportReasonRow key={reason.code} reason={reason} />)}
              </div>
            ))}
          </div>
        </section>

        <section className="report-section">
          <h2>Audit and limitations</h2>
          <dl className="report-kv-grid">
            <ReportDetail label="Snapshot id" value={data.snapshot.id} />
            <ReportDetail label="Score run id" value={data.scoreRun.id} />
            <ReportDetail label="Model version" value={data.modelVersion.version} />
            <ReportDetail label="Generated" value={formatDateTime(data.generatedAt)} />
            <ReportDetail label="Source timestamp" value={formatDateTime(data.snapshot.source_fetched_at)} />
            <ReportDetail label="Export recorded" value={data.exportRecord ? formatDateTime(data.exportRecord.exported_at) : "Not recorded yet"} />
          </dl>
          <p className="report-disclaimer report-disclaimer--compact">{CREDITSHARK_PRODUCT_GUARDRAIL}</p>
          <p className="note">This report uses public Companies House evidence, user-entered manual data where present, and transparent rule-based scoring. Missing data is shown rather than hidden.</p>
        </section>
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
  if (notice.exported) return <div className="report-export-banner report-screen-only"><strong>Export recorded.</strong><span>Export id: {exportId ?? singleValue(notice.exportId) ?? "Recorded"}. You can now print or save this preview as PDF.</span></div>;
  if (notice.error) return <div className="error-note report-screen-only" role="alert">{singleValue(notice.error)}</div>;
  return <div className="report-export-banner report-export-banner--preview report-screen-only"><strong>Preview only.</strong><span>Record the export before printing or saving as PDF so the audit trail captures this report context.</span></div>;
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
