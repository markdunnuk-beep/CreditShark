import {
  ActionGroup,
  Badge,
  ButtonLink,
  Card,
  EvidenceChip,
  MetricCard,
  Notice,
  SectionHeader,
  TradeRiskScoreGauge
} from "./components/ui";

export default function HomePage() {
  return (
    <>
      <section className="page-shell hero public-hero">
        <div className="hero-copy">
          <p className="eyebrow">Trade Risk. Calmly Managed.</p>
          <h1>Clear company credit insight for growing SMEs</h1>
          <p className="lede">
            CreditShark helps you understand who you are trading with, spot visible risk signals earlier,
            protect cash flow and record practical commercial decisions without unnecessary complexity.
          </p>
          <ActionGroup className="actions hero-actions">
            <ButtonLink href="/search">Check a company</ButtonLink>
            <ButtonLink href="/app" variant="secondary">View platform dashboard</ButtonLink>
          </ActionGroup>
          <Notice variant="info" className="public-hero-note">
            Built for UK limited-company trade-risk screening, with source-linked evidence and advisory reports.
          </Notice>
        </div>

        <Card className="report-preview-card public-product-preview" aria-label="CreditShark product preview">
          <SectionHeader
            eyebrow="Company risk workspace"
            title="Current trade-risk view"
            description="A calm summary before you review deeper evidence."
            action={<Badge variant="info">Advisory</Badge>}
          />
          <div className="public-preview-grid">
            <TradeRiskScoreGauge
              score={76}
              rating="Moderate Risk"
              interpretation="Some indicators may need review before increasing exposure."
              lastUpdated="latest check"
            />
            <div className="public-preview-metrics">
              <MetricCard label="Recommended limit" value="£7,500" helper="Advisory indicator" />
              <MetricCard label="Confidence" value="Medium" helper="Source freshness visible" />
            </div>
          </div>
          <div className="preview-footer">
            <EvidenceChip sourceType="companies_house" label="Companies House evidence" />
            <EvidenceChip sourceType="model" label="Source-linked reasons" />
            <EvidenceChip sourceType="decision" label="User-recorded decision" />
            <EvidenceChip sourceType="report" label="Report preview" />
          </div>
        </Card>
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
