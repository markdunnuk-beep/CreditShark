import Link from "next/link";

export default function HomePage() {
  return (
    <section className="page-shell hero">
      <div>
        <p className="eyebrow">Source-linked trade-risk screening</p>
        <h1>UK company credit checks before you trade</h1>
        <p className="lede">
          CreditShark helps you check limited companies, review filing risk, spot adverse signals and produce clear trade-risk
          reports using Companies House evidence and transparent scoring.
        </p>
        <div className="actions">
          <Link className="button-primary" href="/search">
            Check a company
          </Link>
        </div>
        <p className="note" style={{ marginTop: 18 }}>
          Advisory decision support for UK limited companies only.
        </p>
      </div>
      <aside className="card ocean-card" aria-label="CreditShark report preview summary">
        <p className="eyebrow">MVP workflow</p>
        <h2>Clear evidence before a trade decision</h2>
        <p className="note">
          Search a company, review source-linked filing evidence, add manual adverse events where needed, then record a
          manually reviewable decision.
        </p>
        <div className="metric-grid" aria-label="Example report contents">
          <div className="metric">
            <div className="metric__label">Score</div>
            <div className="metric__value">Explainable</div>
          </div>
          <div className="metric">
            <div className="metric__label">Sources</div>
            <div className="metric__value">Linked</div>
          </div>
          <div className="metric">
            <div className="metric__label">Use case</div>
            <div className="metric__value">B2B</div>
          </div>
          <div className="metric">
            <div className="metric__label">Scope</div>
            <div className="metric__value">UK Ltd</div>
          </div>
        </div>
      </aside>
    </section>
  );
}
