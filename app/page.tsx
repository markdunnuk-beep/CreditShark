import {
  ActionGroup,
  ButtonLink,
  Notice
} from "./components/ui";
import { CalmFinHero } from "./components/brand/calm-fin-hero";

export default function HomePage() {
  return (
    <>
      <section className="page-shell hero public-hero">
        <div className="hero-copy">
          <p className="eyebrow">Trade Risk. Calmly Managed.</p>
          <h1>Clear credit insight for SMEs before you trade</h1>
          <p className="lede">
            Understand who you are trading with, spot risk earlier and protect cash flow with source-linked
            UK limited-company checks.
          </p>
          <ActionGroup className="actions hero-actions">
            <ButtonLink href="/search">Check a company</ButtonLink>
            <ButtonLink href="/app" variant="secondary">View platform dashboard</ButtonLink>
          </ActionGroup>
          <Notice variant="info" className="public-hero-note">
            Built for UK limited-company trade-risk screening, with source-linked evidence and advisory reports.
          </Notice>
        </div>

        <CalmFinHero className="public-calm-fin-hero" />
      </section>

      <section className="page-shell public-section">
        <div className="proof-row public-benefit-row" aria-label="CreditShark SME benefits">
          <ProofItem title="Understand who you trade with" body="Start from UK limited-company evidence and a clear current-risk summary." />
          <ProofItem title="Spot risk earlier" body="Review filings, charges, score reasons, manual data labels and score movement." />
          <ProofItem title="Protect cash flow" body="Use advisory limits and review factors to guide practical trading terms." />
          <ProofItem title="Record decisions" body="Keep commercial decisions and report exports linked to the latest check." />
        </div>
      </section>

      <section className="page-shell public-section public-section--tight">
        <div className="section-intro">
          <p className="eyebrow">Practical SME workflow</p>
          <h2>From company search to recorded decision</h2>
        </div>
        <div className="benefit-grid">
          <BenefitCard
            title="Search company"
            body="Find a UK limited company by name or Companies House number."
          />
          <BenefitCard
            title="Review risk signals"
            body="See the advisory score, key reasons, missing data and source freshness."
          />
          <BenefitCard
            title="Record and monitor"
            body="Record a commercial decision, export a report and add the company to your watchlist."
          />
        </div>
      </section>
    </>
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
