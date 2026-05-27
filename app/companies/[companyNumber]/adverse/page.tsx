import type { Metadata } from "next";
import Link from "next/link";
import {
  COMPANIES_HOUSE_EVIDENCE_LABEL,
  MANUAL_DATA_INCLUDED_LABEL,
  USER_ENTERED_RECORD_LABEL
} from "../../../../src/lib/guardrails";
import {
  getManualAdverseEventsForCompany,
  MANUAL_ADVERSE_EVENT_STATUSES,
  MANUAL_ADVERSE_EVENT_TYPES,
  type ManualAdverseEventRecord
} from "../../../../src/lib/adverse/manual-adverse-event-service";
import {
  createManualAdverseEventAction,
  deactivateManualAdverseEventAction,
  rerunScoreFromAdversePageAction,
  supersedeManualAdverseEventAction
} from "./actions";

export const metadata: Metadata = {
  title: "Manual adverse events"
};

export const dynamic = "force-dynamic";

export default async function ManualAdversePage({
  params,
  searchParams
}: {
  params: Promise<{ companyNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { companyNumber } = await params;
  const notices = await searchParams;
  const result = await getManualAdverseEventsForCompany(companyNumber);

  if (!result.ok) {
    return <ManualAdverseError companyNumber={companyNumber} message={result.error.message} />;
  }

  const createAction = createManualAdverseEventAction.bind(null, result.data.company.company_number);
  const rerunAction = rerunScoreFromAdversePageAction.bind(null, result.data.company.company_number);

  return (
    <section className="company-tab-page">
      <Notice notices={notices} />

      <section className="card tab-section tab-section--primary">
        <div className="tab-intro">
          <div>
            <p className="eyebrow">Adverse events</p>
            <h2>Charges and manual records</h2>
            <p className="note">Companies House charges and user-entered manual records are shown separately.</p>
          </div>
          <div className="compact-score-strip">
            <span className="source-chip source-chip--companies-house">{COMPANIES_HOUSE_EVIDENCE_LABEL}</span>
            <span className="badge manual-badge">{MANUAL_DATA_INCLUDED_LABEL}: {result.data.activeEvents.length}</span>
          </div>
        </div>
      </section>

      <div className="adverse-grid">
        <section className="card evidence-card evidence-card--companies-house">
          <div className="section-heading">
            <h2>Companies House charges</h2>
            <span className="source-chip source-chip--companies-house">{COMPANIES_HOUSE_EVIDENCE_LABEL}</span>
          </div>
          <dl className="detail-grid">
            <Detail label="Active charges" value={String(result.data.chargesSummary.active)} />
            <Detail label="Satisfied charges" value={String(result.data.chargesSummary.satisfied)} />
            <Detail label="Latest charge date" value={formatDate(result.data.chargesSummary.latestChargeDate)} />
            <Detail label="Source fetched" value={formatDateTime(result.data.chargesSummary.sourceFetchedAt)} />
          </dl>
          <p className="note">
            Charges are sourced from the latest Companies House snapshot and are not the same as manually entered adverse events.
          </p>
        </section>

        <section className="card evidence-card evidence-card--manual">
          <div className="section-heading">
            <h2>Manual records</h2>
            <span className="badge manual-badge">{USER_ENTERED_RECORD_LABEL}</span>
          </div>
          <p className="note">Manual records are user-entered and should be reviewed with their source notes.</p>
          <form action={rerunAction} className="stacked-form">
            <button className="button-secondary" type="submit">Re-run advisory score</button>
            <p className="form-help">Uses the latest persisted snapshot and active manual events. It does not fetch a new Companies House snapshot.</p>
          </form>
        </section>
      </div>

      <section className="card tab-section">
        <div className="section-heading">
          <h2>Active manual adverse events</h2>
          <span className="badge manual-badge">{result.data.activeEvents.length} active</span>
        </div>
        {result.data.activeEvents.length > 0 ? (
          <div className="manual-event-list">
            {result.data.activeEvents.map((event) => (
              <ManualEventCard key={event.id} event={event} companyNumber={result.data.company.company_number} active />
            ))}
          </div>
        ) : (
          <div className="empty-state">No active manual adverse events have been entered for this company.</div>
        )}
      </section>

      <details className="card tab-section collapsed-history">
        <summary>
          <span>Add manual adverse event</span>
          <span className="badge manual-badge">Manual data</span>
        </summary>
        <ManualEventForm action={createAction} submitLabel="Add manual event" />
        <p className="form-help">Manual data affects the next advisory score run. Re-run scoring after adding or changing manual adverse data.</p>
      </details>

      {result.data.inactiveEvents.length > 0 ? (
        <details className="card tab-section inactive-history collapsed-history">
          <summary>
            <span>Superseded and inactive history</span>
            <span className="badge">{result.data.inactiveEvents.length} records</span>
          </summary>
          <div className="manual-event-list manual-event-list--inactive">
            {result.data.inactiveEvents.map((event) => (
              <ManualEventCard key={event.id} event={event} companyNumber={result.data.company.company_number} />
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

function ManualEventCard({ event, companyNumber, active = false }: { event: ManualAdverseEventRecord; companyNumber: string; active?: boolean }) {
  const supersedeAction = supersedeManualAdverseEventAction.bind(null, companyNumber, event.id);
  const deactivateAction = deactivateManualAdverseEventAction.bind(null, companyNumber, event.id);
  const material = active && event.status === "unsatisfied" && Number(event.amount ?? 0) >= 10000;

  return (
    <article className={`manual-event-card ${active ? "manual-event-card--active" : "manual-event-card--inactive"} ${material ? "manual-event-card--material" : ""}`}>
      <div className="manual-event-card__header">
        <div>
          <span className="badge manual-badge">{active ? "Active manual data" : "Inactive manual data"}</span>
          <h3>{formatEventType(event.event_type)}</h3>
        </div>
        <span className={`risk-badge ${material ? "risk-badge--high" : "risk-badge--moderate"}`}>{formatValue(event.status)}</span>
      </div>
      <dl className="detail-grid">
        <Detail label="Event date" value={formatDate(event.event_date)} />
        <Detail label="Amount" value={formatAmount(event.amount, event.currency)} />
        <Detail label="Evidence reference" value={event.evidence_reference || "Not provided"} />
        <Detail label="Entered" value={formatDateTime(event.entered_at)} />
      </dl>
      <p className="manual-source-note"><strong>Source note:</strong> {event.source_note}</p>
      {active ? (
        <div className="manual-event-actions">
          <details>
            <summary>Replace with updated record</summary>
            <ManualEventForm action={supersedeAction} submitLabel="Supersede event" event={event} />
          </details>
          <form action={deactivateAction} className="inline-action-form">
            <label>
              <span className="form-label">Deactivation reason</span>
              <input name="deactivation_reason" required minLength={4} placeholder="e.g. duplicate manual entry" />
            </label>
            <button className="button-secondary" type="submit">Deactivate</button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

function ManualEventForm({
  action,
  submitLabel,
  event
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  event?: ManualAdverseEventRecord;
}) {
  return (
    <form action={action} className="manual-event-form">
      <fieldset className="form-fieldset">
        <legend>Event details</legend>
        <label>
          <span className="form-label">Event type</span>
          <select name="event_type" required defaultValue={event?.event_type ?? "adverse_note"}>
            {MANUAL_ADVERSE_EVENT_TYPES.map((type) => <option key={type} value={type}>{formatEventType(type)}</option>)}
          </select>
        </label>
        <label>
          <span className="form-label">Event date</span>
          <input name="event_date" type="date" defaultValue={event?.event_date ?? ""} />
        </label>
      </fieldset>
      <fieldset className="form-fieldset">
        <legend>Value and status</legend>
        <label>
          <span className="form-label">Status</span>
          <select name="status" required defaultValue={event?.status ?? "note_only"}>
            {MANUAL_ADVERSE_EVENT_STATUSES.map((status) => <option key={status} value={status}>{formatValue(status)}</option>)}
          </select>
        </label>
        <label>
          <span className="form-label">Amount</span>
          <input name="amount" inputMode="decimal" placeholder="Optional" defaultValue={event?.amount == null ? "" : String(event.amount)} />
        </label>
        <label>
          <span className="form-label">Currency</span>
          <input name="currency" maxLength={3} defaultValue={event?.currency ?? "GBP"} />
        </label>
      </fieldset>
      <fieldset className="form-fieldset form-span-2">
        <legend>Source note and evidence</legend>
        <label>
          <span className="form-label">Evidence reference</span>
          <input name="evidence_reference" placeholder="Optional internal reference" defaultValue={event?.evidence_reference ?? ""} />
        </label>
        <label>
          <span className="form-label">Source note</span>
          <textarea name="source_note" required minLength={8} rows={4} placeholder="Briefly explain where this manual information came from and who supplied it." defaultValue={event?.source_note ?? ""} />
        </label>
        <p className="form-help">Use concise, factual source notes. Manual records are not verified registry data and should be reviewed before a decision.</p>
      </fieldset>
      <button className="button-primary" type="submit">{submitLabel}</button>
    </form>
  );
}

function Notice({ notices }: { notices: Record<string, string | string[] | undefined> }) {
  if (notices.created) return <div className="status-note">Manual adverse event added. Re-run scoring to include it in a new advisory score.</div>;
  if (notices.superseded) return <div className="status-note">Manual adverse event superseded. Re-run scoring to include the updated record.</div>;
  if (notices.deactivated) return <div className="status-note">Manual adverse event deactivated. Re-run scoring to remove it from the next advisory score.</div>;
  if (notices.error) return <div className="error-note" role="alert">{Array.isArray(notices.error) ? notices.error[0] : notices.error}</div>;
  return null;
}

function ManualAdverseError({ companyNumber, message }: { companyNumber: string; message: string }) {
  return (
    <section className="page-shell">
      <div className="placeholder-stack">
        <p className="eyebrow">Manual adverse events</p>
        <h1 className="page-title">Manual adverse data unavailable</h1>
        <div className="error-note" role="alert">
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatEventType(value: string): string {
  return value.replace(/_/g, " ");
}

function formatValue(value: string): string {
  return value.replace(/_/g, " ");
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatAmount(value: string | number | null, currency: string): string {
  if (value == null) return "Not provided";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value));
}
