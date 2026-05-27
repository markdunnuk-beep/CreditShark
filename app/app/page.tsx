import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell } from "../components/platform-shell";
import {
  formatDashboardMoney,
  formatDashboardValue,
  getDashboardOverview,
  type DashboardDecision,
  type DashboardOverview,
  type DashboardRecentCheck,
  type DashboardReportExport,
  type DashboardScoreMovement
} from "../../src/lib/dashboard/dashboard-service";

export const metadata: Metadata = {
  title: "Dashboard"
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const result = await getDashboardOverview();

  return (
    <PlatformShell active="dashboard">
      <section className="platform-page dashboard-page">
        <div className="dashboard-hero">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1 className="page-title">Dashboard</h1>
            <p className="dashboard-brand-line">Trade risk, calmly managed.</p>
            <p className="lede">
              Search companies, review recent checks, monitor your watchlist and continue trade-risk decisions.
            </p>
          </div>
          <Link className="button-secondary" href="/watchlist">
            View watchlist
          </Link>
        </div>

        <section className="card dashboard-search-card" aria-label="Company search">
          <div>
            <p className="eyebrow">Company search</p>
            <h2>Check who you are trading with</h2>
            <p className="note">Search by company name or Companies House number.</p>
          </div>
          <form action="/search" className="dashboard-search-form" method="get">
            <label className="sr-only" htmlFor="dashboard-company-search">
              Company name or Companies House number
            </label>
            <input
              className="search-input"
              id="dashboard-company-search"
              name="query"
              placeholder="Company name or Companies House number"
              type="search"
            />
            <button className="button-primary" type="submit">
              Search company
            </button>
          </form>
        </section>

        {!result.ok ? <DashboardConfigurationState message={result.error.message} /> : <DashboardOverviewView data={result.data} />}
      </section>
    </PlatformShell>
  );
}

function DashboardOverviewView({ data }: { data: DashboardOverview }) {
  return (
    <>
      <section className="summary-cards dashboard-summary-cards" aria-label="Platform summary">
        <SummaryCard label="Watched companies" value={data.watchlistSummary.totalWatched} />
        <SummaryCard label="Need review" value={data.watchlistSummary.requiringReviewCount} />
        <SummaryCard label="High or very high risk" value={data.watchlistSummary.highOrVeryHighRiskCount} />
        <SummaryCard label="Checked in 7 days" value={data.watchlistSummary.recentlyCheckedCount} />
      </section>

      {data.watchlistSummary.totalWatched === 0 ? (
        <div className="empty-state dashboard-empty-state">
          <strong>No watched companies yet.</strong>
          <div>Add a company from its profile after running a CreditShark check.</div>
          <Link className="button-primary" href="/search">
            Search companies
          </Link>
        </div>
      ) : null}

      <div className="dashboard-grid">
        <DashboardPanel title="Recently checked companies" badge={`${data.recentChecks.length} checks`}>
          {data.recentChecks.length > 0 ? (
            <div className="dashboard-list">
              {data.recentChecks.map((item) => <RecentCheckCard key={item.score_run_id} item={item} />)}
            </div>
          ) : (
            <PanelEmptyState text="Open a company profile to create a latest CreditShark check." />
          )}
        </DashboardPanel>

        <DashboardPanel title="Recent score movements" badge="Latest two checks">
          {data.scoreMovements.length > 0 ? (
            <div className="dashboard-list">
              {data.scoreMovements.map((item) => <MovementCard key={item.company_number} item={item} />)}
            </div>
          ) : (
            <PanelEmptyState text="Score movements will appear after companies have score history." />
          )}
        </DashboardPanel>

        <DashboardPanel title="Recent decisions" badge={`${data.recentDecisions.length} records`}>
          {data.recentDecisions.length > 0 ? (
            <div className="dashboard-list">
              {data.recentDecisions.map((item) => <DecisionCard key={item.id} item={item} />)}
            </div>
          ) : (
            <PanelEmptyState text="User-recorded decisions will appear here once recorded." />
          )}
        </DashboardPanel>

        <DashboardPanel title="Recent report exports" badge={`${data.recentReportExports.length} exports`}>
          {data.recentReportExports.length > 0 ? (
            <div className="dashboard-list">
              {data.recentReportExports.map((item) => <ReportExportCard key={item.id} item={item} />)}
            </div>
          ) : (
            <PanelEmptyState text="Report exports will appear here after a report is recorded." />
          )}
        </DashboardPanel>
      </div>

      <section className="card monitoring-note-card">
        <div>
          <div className="section-heading">
            <h2>Monitoring note</h2>
            <span className="badge">Later phase</span>
          </div>
          <p className="note">Automated monitoring and alerts are planned for a later phase.</p>
        </div>
        <dl className="detail-grid detail-grid--compact">
          <Detail label="Monitoring events" value={String(data.monitoringSummary.totalEvents)} />
          <Detail label="Review events" value={String(data.monitoringSummary.reviewEvents)} />
          <Detail label="Material events" value={String(data.monitoringSummary.materialEvents)} />
          <Detail label="Latest event" value={formatDateTime(data.monitoringSummary.latestDetectedAt)} />
        </dl>
      </section>
    </>
  );
}

function DashboardConfigurationState({ message }: { message: string }) {
  return (
    <div className="empty-state dashboard-empty-state">
      <strong>Dashboard data is not configured yet.</strong>
      <div>{message}</div>
      <div>Company search remains available. Recent checks, watchlist, decisions and reports will appear when the database is available.</div>
      <Link className="button-primary" href="/search">
        Search companies
      </Link>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DashboardPanel({ title, badge, children }: { title: string; badge: string; children: React.ReactNode }) {
  return (
    <section className="card dashboard-panel">
      <div className="section-heading">
        <h2>{title}</h2>
        <span className="badge">{badge}</span>
      </div>
      {children}
    </section>
  );
}

function RecentCheckCard({ item }: { item: DashboardRecentCheck }) {
  return (
    <article className="dashboard-list-card">
      <div>
        <Link href={`/companies/${item.company_number}`}>
          <strong>{item.company_name}</strong>
        </Link>
        <span>Company number {item.company_number}</span>
      </div>
      <div className="dashboard-list-card__meta">
        <span className={`risk-badge risk-badge--${item.risk_band}`}>{formatDashboardValue(item.risk_band)}</span>
        <strong>{item.score ?? "NS"}</strong>
        <span>{formatDashboardMoney(item.recommended_limit, item.currency)}</span>
      </div>
      <small>Checked {formatDateTime(item.run_at)}</small>
    </article>
  );
}

function MovementCard({ item }: { item: DashboardScoreMovement }) {
  return (
    <article className="dashboard-list-card">
      <div>
        <Link href={`/companies/${item.company_number}/history`}>
          <strong>{item.company_name}</strong>
        </Link>
        <span>Company number {item.company_number}</span>
      </div>
      <p>{item.movement.message}</p>
      {item.movement.bandMessage ? <small>{item.movement.bandMessage}</small> : <small>Latest check {formatDateTime(item.latest_run_at)}</small>}
    </article>
  );
}

function DecisionCard({ item }: { item: DashboardDecision }) {
  return (
    <article className="dashboard-list-card">
      <div>
        <Link href={`/companies/${item.company_number}/decision`}>
          <strong>{item.company_name}</strong>
        </Link>
        <span>User-recorded decision: {formatDashboardValue(item.decision)}</span>
      </div>
      <small>Recorded {formatDateTime(item.decided_at)}</small>
    </article>
  );
}

function ReportExportCard({ item }: { item: DashboardReportExport }) {
  return (
    <article className="dashboard-list-card">
      <div>
        <Link href={`/companies/${item.company_number}/report`}>
          <strong>{item.company_name}</strong>
        </Link>
        <span>{item.decision_record_id ? "Decision linked" : "No linked decision"}</span>
      </div>
      <small>Exported {formatDateTime(item.exported_at)}</small>
    </article>
  );
}

function PanelEmptyState({ text }: { text: string }) {
  return <div className="dashboard-panel-empty">{text}</div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
