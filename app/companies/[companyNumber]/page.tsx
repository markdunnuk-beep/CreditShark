import type { Metadata } from "next";
import Link from "next/link";
import { createCompanySnapshotFromCompaniesHouse } from "../../../src/lib/companies/company-snapshot-service";
import type { CreatedCompanySnapshot } from "../../../src/lib/companies/company-snapshot-service";

export const metadata: Metadata = {
  title: "Company profile"
};

export const dynamic = "force-dynamic";

export default async function CompanyProfilePage({ params }: { params: Promise<{ companyNumber: string }> }) {
  const { companyNumber } = await params;
  const result = await createCompanySnapshotFromCompaniesHouse(companyNumber, { createdVia: "company_profile_route" });

  if (!result.ok) {
    return <CompanyProfileError companyNumber={companyNumber} message={result.error.message} />;
  }

  return <CompanyProfile data={result.data} />;
}

function CompanyProfile({ data }: { data: CreatedCompanySnapshot }) {
  const company = data.company;
  const snapshot = data.snapshot;

  return (
    <section className="page-shell">
      <div className="profile-header">
        <div>
          <p className="eyebrow">Company profile</p>
          <h1 className="page-title">{company.company_name}</h1>
          <p className="lede">
            Source-timestamped Companies House snapshot for UK limited-company trade-risk screening.
          </p>
        </div>
        <div className="profile-actions">
          <Link className="button-secondary" href="/search">
            Back to search
          </Link>
          <Link className="button-primary" href={`/companies/${company.company_number}`}>
            Refresh snapshot
          </Link>
        </div>
      </div>

      <div className="status-note">
        Each refresh creates a new point-in-time snapshot. Creates a new source-timestamped Companies House snapshot.
      </div>

      <div className="profile-grid">
        <section className="card profile-summary-card">
          <div className="section-heading">
            <h2>Company identity</h2>
            <span className="badge">Companies House evidence</span>
          </div>
          <dl className="detail-grid">
            <Detail label="Company number" value={company.company_number} />
            <Detail label="Status" value={formatValue(company.company_status)} />
            <Detail label="Type" value={formatValue(company.company_type)} />
            <Detail label="Jurisdiction" value={formatValue(company.jurisdiction)} />
            <Detail label="Registered office postcode" value={formatValue(company.registered_office_postcode)} />
            <Detail label="Incorporated" value={formatDate(company.incorporated_on)} />
            <Detail label="Company age" value={formatAge(snapshot.derived_company_age_months)} />
            <Detail label="Latest accounts" value={formatDate(snapshot.latest_accounts_date)} />
            <Detail label="Latest confirmation statement" value={formatDate(snapshot.latest_confirmation_statement_date)} />
            <Detail label="Source fetched" value={formatDateTime(data.sourceFetchedAt)} />
            <Detail label="Snapshot status" value={formatValue(snapshot.snapshot_status)} />
            <Detail label="Snapshot id" value={snapshot.id} />
          </dl>
        </section>

        <aside className="card ocean-card decision-placeholder">
          <p className="eyebrow">Decision summary</p>
          <h2>Scoring is next</h2>
          <dl className="decision-list">
            <Detail label="Score" value="Not run yet" />
            <Detail label="Risk band" value="Not scored" />
            <Detail label="Recommended limit" value="Not available yet" />
            <Detail label="Next action" value="Run scoring in the next build slice" />
          </dl>
          <div className="disabled-actions">
            <span aria-disabled="true" className="button-secondary disabled-button">
              Score coming next
            </span>
            <span aria-disabled="true" className="button-secondary disabled-button">
              Export report coming later
            </span>
          </div>
        </aside>
      </div>

      <section className="summary-cards" aria-label="Snapshot captured records">
        <SummaryCard label="Filing records captured" value={data.filingsSummary.count} />
        <SummaryCard label="Active charges" value={data.chargesSummary.active} />
        <SummaryCard label="Satisfied charges" value={data.chargesSummary.satisfied} />
        <SummaryCard label="Current officers" value={data.officersSummary.current} />
        <SummaryCard label="PSC records" value={data.pscSummary.count} />
        <SummaryCard label="Missing/failed sections" value={data.missingSections.length} />
      </section>

      {data.missingSections.length > 0 ? (
        <div className="error-note">
          <strong>Partial snapshot.</strong>
          <div>These Companies House sections were unavailable or failed: {data.missingSections.join(", ")}.</div>
        </div>
      ) : null}
    </section>
  );
}

function CompanyProfileError({ companyNumber, message }: { companyNumber: string; message: string }) {
  return (
    <section className="page-shell">
      <div className="placeholder-stack">
        <p className="eyebrow">Company profile</p>
        <h1 className="page-title">Snapshot could not be created</h1>
        <div className="error-note" role="alert">
          <strong>{companyNumber}</strong>
          <div>{message}</div>
        </div>
        <div className="actions">
          <Link className="button-secondary" href="/search">
            Back to search
          </Link>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <div className="metric__label">{label}</div>
      <div className="metric__value">{value}</div>
    </div>
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

function formatAge(months: number | null): string {
  if (months == null) return "Not available";
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (years === 0) return `${remainingMonths} month${remainingMonths === 1 ? "" : "s"}`;
  return `${years} year${years === 1 ? "" : "s"} ${remainingMonths} month${remainingMonths === 1 ? "" : "s"}`;
}

