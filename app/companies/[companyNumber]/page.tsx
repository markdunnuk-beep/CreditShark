import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Company profile"
};

export default async function CompanyPlaceholderPage({ params }: { params: Promise<{ companyNumber: string }> }) {
  const { companyNumber } = await params;

  return (
    <section className="page-shell">
      <div className="placeholder-stack">
        <p className="eyebrow">Company profile</p>
        <h1 className="page-title">Company profile build is next</h1>
        <div className="card">
          <h2>{companyNumber}</h2>
          <p className="note">
            Search result links are in place, but CreditShark has not yet created company snapshots, score runs or persisted
            profiles. The next build slice should fetch Companies House data, create a snapshot and show the first profile viewport.
          </p>
          <div className="actions">
            <Link className="button-secondary" href="/search">
              Back to search
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
