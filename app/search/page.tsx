import type { Metadata } from "next";
import Link from "next/link";
import { createCompaniesHouseClient } from "../../src/lib/companies-house/client";
import type { CompaniesHouseSearchItem } from "../../src/types/companies-house";

export const metadata: Metadata = {
  title: "Search"
};

interface SearchPageProps {
  searchParams?: Promise<{ query?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = (params?.query ?? "").trim();
  const result = query ? await searchCompanies(query) : null;

  return (
    <section className="page-shell">
      <p className="eyebrow">Company search</p>
      <h1 className="page-title">Search for a UK limited company</h1>
      <p className="lede">
        Enter a company name or Companies House number to create a screening starting point.
      </p>

      <div className="card search-panel">
        <form action="/search" className="search-form" method="get">
          <label className="sr-only" htmlFor="company-search">
            Company name or Companies House number
          </label>
          <input
            className="search-input"
            defaultValue={query}
            id="company-search"
            name="query"
            placeholder="Company name or Companies House number"
            type="search"
          />
          <button className="button-primary" type="submit">
            Search
          </button>
        </form>
        <p className="note" style={{ margin: "12px 0 0" }}>
          CreditShark is for UK limited-company trade-risk screening only.
        </p>
      </div>

      {!query ? <InitialEmptyState /> : null}
      {result?.kind === "error" ? <ErrorState message={result.message} /> : null}
      {result?.kind === "success" ? <SearchResults query={query} items={result.items} /> : null}
    </section>
  );
}

async function searchCompanies(query: string): Promise<
  | { kind: "success"; items: CompaniesHouseSearchItem[] }
  | { kind: "error"; message: string }
> {
  const client = createCompaniesHouseClient();
  const response = await client.searchCompanies(query);

  if (!response.ok) {
    const message = response.error.code === "missing_api_key"
      ? "Companies House search is not configured. Add COMPANIES_HOUSE_API_KEY on the server to enable live search."
      : response.error.message;
    return { kind: "error", message };
  }

  return { kind: "success", items: response.data.items ?? [] };
}

function InitialEmptyState() {
  return (
    <div className="empty-state">
      <strong>Search by company name or number.</strong>
      <div>Results will show company identity fields only. Snapshots, scoring and persistence are coming next.</div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-note" role="alert">
      <strong>Search unavailable.</strong>
      <div>{message}</div>
    </div>
  );
}

function SearchResults({ query, items }: { query: string; items: CompaniesHouseSearchItem[] }) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <strong>No companies found.</strong>
        <div>Check the spelling or try a Companies House number.</div>
      </div>
    );
  }

  const normalisedQuery = query.replace(/\s/g, "").toLowerCase();

  return (
    <>
      <div className="status-note">
        Showing {items.length} Companies House result{items.length === 1 ? "" : "s"}. Select a company profile in the next build slice.
      </div>
      <div className="results">
        {items.map((item) => {
          const exactNumberMatch = item.company_number.toLowerCase() === normalisedQuery;
          return (
            <article className="result-card" key={item.company_number}>
              <div>
                <Link className="result-card__title" href={`/companies/${item.company_number}`}>
                  {item.title}
                </Link>
                <div className="result-meta">Company number {item.company_number}</div>
                {exactNumberMatch ? <span className="badge">Exact number match</span> : null}
              </div>
              <ResultField label="Status" value={formatValue(item.company_status)} />
              <ResultField label="Type" value={formatValue(item.company_type)} />
              <ResultField label="Created" value={formatValue(item.date_of_creation)} />
              <ResultField label="Location" value={formatAddress(item)} />
            </article>
          );
        })}
      </div>
    </>
  );
}

function ResultField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="result-meta">{label}</div>
      <div>{value}</div>
    </div>
  );
}

function formatValue(value: string | undefined): string {
  return value ? value.replace(/-/g, " ") : "Not available";
}

function formatAddress(item: CompaniesHouseSearchItem): string {
  return item.address_snippet || "Not available";
}
