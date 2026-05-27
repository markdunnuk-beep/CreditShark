import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell } from "../components/platform-shell";
import { LATEST_CHECK_LABEL } from "../../src/lib/guardrails";
import {
  formatWatchlistMoney,
  formatWatchlistValue,
  getWatchlist,
  type WatchlistCompanyContext,
  type WatchlistSummary
} from "../../src/lib/watchlist/watchlist-service";
import { removeCompanyFromWatchlistAction } from "./actions";
import { Badge, Button, ButtonLink, Card, MetricCard, Notice, ResponsiveTableShell, RiskBadge, SectionHeader } from "../components/ui";

export const metadata: Metadata = {
  title: "Watchlist"
};

export const dynamic = "force-dynamic";

export default async function WatchlistPage() {
  const result = await getWatchlist();

  if (!result.ok) {
    return <WatchlistError message={result.error.message} />;
  }

  return <WatchlistView items={result.data.items} summary={result.data.summary} />;
}

function WatchlistView({ items, summary }: { items: WatchlistCompanyContext[]; summary: WatchlistSummary }) {
  return (
    <PlatformShell active="watchlist">
      <section className="platform-page">
      <div className="profile-header">
        <div>
          <p className="eyebrow">Watchlist</p>
          <h1 className="page-title">Companies you are actively reviewing or monitoring.</h1>
          <p className="lede">
            Latest check shown is the latest CreditShark score run. This is not continuous monitoring yet.
          </p>
        </div>
        <div className="profile-actions">
          <ButtonLink variant="secondary" href="/search">
            Find company
          </ButtonLink>
        </div>
      </div>

      <Notice className="status-note--compact" variant="info">
        {LATEST_CHECK_LABEL}: watchlist rows show existing CreditShark checks. Automated change monitoring and alerts are planned for a later phase.
      </Notice>

      <section className="summary-cards" aria-label="Watchlist summary">
        <SummaryCard label="Watched companies" value={summary.totalWatched} />
        <SummaryCard label="High or very high risk" value={summary.highOrVeryHighRiskCount} />
        <SummaryCard label="Requiring review" value={summary.requiringReviewCount} />
        <SummaryCard label="Checked in last 7 days" value={summary.recentlyCheckedCount} />
        <SummaryCard label="Active manual adverse" value={summary.activeManualAdverseEventCount} />
      </section>

      {items.length === 0 ? (
        <div className="empty-state">
          <strong>No companies on your watchlist yet.</strong>
          <div>Add a company from its profile after running a CreditShark check.</div>
          <Link className="button-primary" href="/search">
            Search companies
          </Link>
        </div>
      ) : (
        <Card className="score-section">
          <SectionHeader title="Watched companies" action={<Badge>{items.length} active</Badge>} />
          <ResponsiveTableShell className="watchlist-table-wrap">
            <table className="watchlist-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Current score</th>
                  <th>Recommended limit</th>
                  <th>Last checked</th>
                  <th>Movement</th>
                  <th>Decision/report</th>
                  <th>Watch reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => <WatchlistRow key={item.watchlist.id} item={item} />)}
              </tbody>
            </table>
          </ResponsiveTableShell>
        </Card>
      )}

      <Card className="score-section">
        <SectionHeader title="Monitoring note" action={<Badge>MVP foundation</Badge>} />
        <p className="note">
          The watchlist is a workflow aid. It shows the latest CreditShark checks already created in the app and prepares the data model for future source-change monitoring.
        </p>
      </Card>
      </section>
    </PlatformShell>
  );
}

function WatchlistRow({ item }: { item: WatchlistCompanyContext }) {
  const latest = item.latestScore;
  return (
    <tr>
      <td>
        <strong>{item.company.company_name}</strong>
        <div className="secondary-id">Company number {item.company.company_number}</div>
      </td>
      <td>
        {latest ? (
          <>
            <strong>{latest.score ?? "NS"}</strong>
            <RiskBadge riskBand={latest.risk_band} />
            <div className="secondary-id">Confidence {formatWatchlistValue(latest.confidence_level)}</div>
          </>
        ) : "No score run"}
      </td>
      <td>{latest ? formatWatchlistMoney(latest.recommended_limit, latest.currency) : "Not available"}</td>
      <td>{latest ? formatDateTime(latest.run_at) : formatDateTime(item.watchlist.last_checked_at)}</td>
      <td>{item.scoreMovement.message}</td>
      <td>
        <div>{item.latestDecision ? formatWatchlistValue(item.latestDecision.decision) : "No recorded decision"}</div>
        <div className="secondary-id">{item.latestReport ? `Report exported ${formatDateTime(item.latestReport.exported_at)}` : "No report export"}</div>
      </td>
      <td>{item.watchlist.watch_reason ?? "Not provided"}</td>
      <td>
        <div className="table-actions">
          <Link href={`/companies/${item.company.company_number}`}>Profile</Link>
          <Link href={`/companies/${item.company.company_number}/history`}>History</Link>
          <Link href={`/companies/${item.company.company_number}/score`}>Score</Link>
        </div>
        <form action={removeCompanyFromWatchlistAction.bind(null, item.company.company_number, "watchlist")}>
          <Button size="sm" variant="ghost" type="submit">Remove</Button>
        </form>
      </td>
    </tr>
  );
}

function WatchlistError({ message }: { message: string }) {
  return (
    <PlatformShell active="watchlist">
      <section className="platform-page">
      <div className="placeholder-stack">
        <p className="eyebrow">Watchlist</p>
        <h1 className="page-title">Watchlist unavailable</h1>
        <div className="error-note" role="alert">{message}</div>
        <Link className="button-primary" href="/search">
          Back to search
        </Link>
      </div>
      </section>
    </PlatformShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return <MetricCard className="summary-card" label={label} value={value} />;
}

function formatDateTime(value: string | null): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
