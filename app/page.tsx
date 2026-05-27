import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="page-shell hero public-hero">
        <div className="hero-copy">
          <p className="eyebrow">Source-linked trade-risk screening</p>
          <h1>UK company credit checks before you trade</h1>
          <p className="lede">
            Review UK limited companies with Companies House evidence, transparent reason codes, manual adverse data where needed,
            and audit-ready advisory reports.
          </p>
          <div className="actions hero-actions">
            <Link className="button-primary" href="/search">
              Check a company
            </Link>
            <Link className="button-secondary" href="/companies/00445790/report">
              View sample report
            </Link>
          </div>
          <p className="compact-guardrail">Trade Risk. Calmly Managed.</p>
        </div>

        <aside className="report-preview-card" aria-label="CreditShark product preview">
          <div className="preview-header">
            <div>
              <p className="eyebrow">Example report preview</p>
              <h2>Decision summary first</h2>
            </div>
            <span className="risk-badge risk-badge--low">Low risk</span>
          </div>
          <div className="preview-score-row">
            <div>
              <span className="preview-label">Advisory score</span>
              <strong>72</strong>
            </div>
            <div>
              <span className="preview-label">Recommended limit</span>
              <strong>£10,000</strong>
            </div>
          </div>
          <div className="preview-reasons" aria-label="Example report evidence">
            <PreviewReason label="Active company" meta="Companies House evidence" tone="positive" />
            <PreviewReason label="Latest accounts date available" meta="Source-linked reason" tone="positive" />
            <PreviewReason label="Manual adverse data" meta="Labelled separately" tone="manual" />
          </div>
          <div className="preview-footer">
            <span className="source-chip">Model v1.0.0</span>
            <span className="source-chip">Exportable report</span>
          </div>
        </aside>
      </section>

      <section className="page-shell public-section">
        <div className="proof-row" aria-label="CreditShark trust signals">
          <ProofItem title="Companies House evidence" body="Profiles, filings, charges, officers and PSC context." />
          <ProofItem title="Transparent scoring" body="Rule-based scores with reason codes and source dates." />
          <ProofItem title="Manual review" body="Manual adverse data is labelled and reviewable." />
          <ProofItem title="Audit-ready reports" body="Snapshot, model and score-run context preserved." />
        </div>
      </section>

      <section className="page-shell public-section public-section--tight">
        <div className="section-intro">
          <p className="eyebrow">Built for trade-risk review</p>
          <h2>Clear evidence before a commercial decision</h2>
        </div>
        <div className="benefit-grid">
          <BenefitCard
            title="Check company risk before you trade"
            body="Search by company name or number and start from public UK limited-company evidence."
          />
          <BenefitCard
            title="See the reasons behind the score"
            body="Review positive, negative and missing-data drivers before extending material credit."
          />
          <BenefitCard
            title="Export an advisory report"
            body="Create a print-ready report with timestamps, limitations, model version and audit context."
          />
        </div>
      </section>
    </>
  );
}

function PreviewReason({ label, meta, tone }: { label: string; meta: string; tone: "positive" | "manual" }) {
  return (
    <div className={`preview-reason preview-reason--${tone}`}>
      <span>{label}</span>
      <small>{meta}</small>
    </div>
  );
}

function ProofItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="proof-item">
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}

function BenefitCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="benefit-card">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}
