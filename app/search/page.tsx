import type { Metadata } from "next";
import Link from "next/link";
import { PlatformShell } from "../components/platform-shell";
import { COMPANIES_HOUSE_EVIDENCE_LABEL, SOURCE_LINKED_EVIDENCE_LABEL } from "../../src/lib/guardrails";
import { createCompaniesHouseClient } from "../../src/lib/companies-house/client";
import type { CompaniesHouseSearchItem } from "../../src/types/companies-house";
import { Badge, Button, ButtonLink, Card, EvidenceChip, Field, Notice, TextInput } from "../components/ui";

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
    <PlatformShell active="search">
      <section className="platform-page search-page">
      <div className="search-hero">
        <p className="eyebrow">Company search</p>
        <h1 className="page-title">Search for a UK limited company</h1>
        <p className="lede">
          Search by company name or Companies House number. Use an exact company number for the cleanest match.
        </p>
      </div>

      <Card className="search-panel search-panel--polished">
        <form action="/search" className="search-form" method="get">
          <Field className="search-field" label="Company name or Companies House number">
            <TextInput defaultValue={query} id="company-search" name="query" placeholder="Company name or Companies House number" type="search" />
          </Field>
          <Button type="submit">Search</Button>
        </form>
        <div className="search-hints" aria-label="Search guidance">
          <Badge>UK limited companies only</Badge>
          <EvidenceChip sourceType="companies_house" label={COMPANIES_HOUSE_EVIDENCE_LABEL} />
          <EvidenceChip sourceType="model" label={SOURCE_LINKED_EVIDENCE_LABEL} />
        </div>
      </Card>

      {!query ? <InitialEmptyState /> : null}
      {result?.kind === "error" ? <ErrorState message={result.message} /> : null}
      {result?.kind === "success" ? <SearchResults query={query} items={result.items} /> : null}
      </section>
    </PlatformShell>
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
    <Notice className="empty-state--search" variant="info" title="Search by company name or Companies House number.">
      <div>Use exact company number for the cleanest match. Search results do not create snapshots until you open a profile.</div>
    </Notice>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Notice variant="error" title="Search unavailable">
      <div>{message}</div>
      <div>Try again later or check that server-side Companies House configuration is available.</div>
    </Notice>
  );
}

function SearchResults({ query, items }: { query: string; items: CompaniesHouseSearchItem[] }) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <strong>No companies found.</strong>
        <div>Check the spelling, remove extra punctuation or try the exact Companies House number.</div>
      </div>
    );
  }

  const normalisedQuery = query.replace(/\s/g, "").toLowerCase();

  return (
    <>
      <div className="status-note">
        Showing {items.length} Companies House result{items.length === 1 ? "" : "s"}. Open a profile to create a fresh screening snapshot.
      </div>
      <div className="results">
        {items.map((item) => {
          const exactNumberMatch = item.company_number.toLowerCase() === normalisedQuery;
          return (
            <article className="result-card" key={item.company_number}>
              <div className="result-card__identity">
                <div className="result-card__title-row">
                  <Link className="result-card__title" href={`/companies/${item.company_number}`}>
                    {item.title}
                  </Link>
                  {exactNumberMatch ? <Badge className="exact-match-badge" variant="info">Exact number match</Badge> : null}
                </div>
                <div className="result-card__number">Company number {item.company_number}</div>
              </div>
              <div className="result-card__meta-grid">
                <ResultField label="Status" value={formatValue(item.company_status)} badge />
                <ResultField label="Type" value={formatValue(item.company_type)} />
                <ResultField label="Created" value={formatValue(item.date_of_creation)} />
                <ResultField label="Location" value={formatAddress(item)} wide />
              </div>
              <ButtonLink className="result-action" variant="secondary" href={`/companies/${item.company_number}`}>
                Open profile
              </ButtonLink>
            </article>
          );
        })}
      </div>
    </>
  );
}

function ResultField({ label, value, badge = false, wide = false }: { label: string; value: string; badge?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? "result-field result-field--wide" : "result-field"}>
      <div className="result-meta">{label}</div>
      <div className={badge ? "status-value" : undefined}>{value}</div>
    </div>
  );
}

function formatValue(value: string | undefined): string {
  return value ? value.replace(/-/g, " ") : "Not available";
}

function formatAddress(item: CompaniesHouseSearchItem): string {
  return item.address_snippet || "Not available";
}
