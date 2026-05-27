import type { Metadata } from "next";
import {
  ActionGroup,
  Badge,
  Button,
  ButtonLink,
  Card,
  DetailList,
  EvidenceChip,
  EvidencePanel,
  Field,
  MetricCard,
  Notice,
  ResponsiveTableShell,
  RiskBadge,
  SectionHeader,
  TextInput,
  TradeRiskScoreGauge
} from "../components/ui";
import { CalmFinHero } from "../components/brand/calm-fin-hero";
import { CREDITSHARK_FOOTER_DISCLAIMER } from "../../src/lib/guardrails";

export const metadata: Metadata = {
  title: "Brand System",
  description: "The live visual reference for the CreditShark brand system, voice, components and compliance boundaries."
};

const brandPrinciples = [
  ["Calm, not passive", "Composed and reassuring, with enough structure to give users confidence that risk can be understood and managed."],
  ["Clear, not simplistic", "Simplify trade-risk insight without losing the evidence, source freshness or commercial context that users need."],
  ["Practical, not theoretical", "Help SMEs decide what to review next, which terms to consider and when to record a decision."],
  ["Alert, not alarming", "Surface review points early without dramatic, threatening or fear-led language."],
  ["SME-first, not corporate-heavy", "Keep the product accessible to owners, finance users and credit-control teams, not only bureau specialists."],
  ["Affordable, not cheap", "Communicate value and accessibility while preserving trust, precision and commercial credibility."]
];

const palette = [
  ["Deep Navy", "#0D2B45", "Wordmark, headings, primary text, strong UI elements"],
  ["Signal Teal", "#1CA3A6", "Wave mark, highlights, active states, CTAs, key accents"],
  ["Fresh Aqua", "#6DD1D6", "Secondary accents, soft panels, gentle emphasis"],
  ["Soft Mist", "#F0F2F4", "Page backgrounds, panels, subdued card surfaces"],
  ["Clean White", "#FAFBFC", "Main surfaces, cards, reports and dashboard areas"]
];

const functionalColours = [
  ["Caution amber", "#E9A23B", "Review recommended"],
  ["Muted coral", "#D94C4C", "Material risk signal"],
  ["Signal teal", "#1CA3A6", "Monitoring state"],
  ["Deep navy", "#0D2B45", "Neutral structure"]
];

const preferredLanguage = [
  "Clear credit insights",
  "Trade risk awareness",
  "Spot risk earlier",
  "Protect cash flow",
  "Make informed decisions",
  "Review before extending further credit"
];

const avoidedLanguage = [
  "Dangerous debtor",
  "Guaranteed credit decision",
  "Approved / declined",
  "Safe / unsafe",
  "Creditworthy / not creditworthy",
  "Fear-led warning copy"
];

const reportStructure = [
  "Company overview",
  "Risk summary",
  "Key signals",
  "Watch points",
  "Practical guidance",
  "Monitoring or watchlist action",
  "Legal and compliance boundary"
];

const scoreBands = [
  ["80-100", "Low Risk", "No major visible concern in the current advisory view."],
  ["60-79", "Moderate Risk", "Some indicators may need review before increasing exposure."],
  ["40-59", "Elevated Risk", "Multiple review factors or limited confidence may affect terms."],
  ["0-39", "High Risk", "Material review factors should be considered before extending further credit."]
];

const checklistItems = [
  "Does the work feel calm, clear and commercially useful?",
  "Is the next action obvious without turning the UI into a dense bureau screen?",
  "Are risk colours restrained and paired with plain-English labels?",
  "Is manual data clearly labelled separately from Companies House evidence?",
  "Does the copy avoid consumer-credit, regulated-rating and lending-decision language?",
  "Is the approved legal wording present in appropriate footer, legal or report contexts without repeated blocks?"
];

export default function BrandPage() {
  return (
    <div className="brand-page">
      <section className="page-shell brand-hero">
        <div className="brand-hero__copy">
          <p className="eyebrow">Brand system v1.0</p>
          <h1>CreditShark</h1>
          <p className="brand-hero__line">Trade Risk. Calmly Managed.</p>
          <p className="lede">
            CreditShark empowers SMEs with clear, affordable credit insights and practical risk awareness. It helps
            growing businesses understand who they are trading with, spot potential risk early, protect cash flow and
            make confident commercial decisions without unnecessary complexity.
          </p>
          <p>
            The central visual idea is the Calm Fin: a clear signal above a smooth waterline. It represents visibility
            before risk fully surfaces, measured decision-making and calm control.
          </p>
          <ActionGroup className="hero-actions">
            <ButtonLink href="/">Homepage</ButtonLink>
            <ButtonLink href="/search" variant="secondary">Check a company</ButtonLink>
          </ActionGroup>
        </div>
        <CalmFinHero variant="brand" className="brand-calm-fin-hero">
          <Card variant="elevated" className="brand-hero__panel">
            <SectionHeader
              eyebrow="Brand idea"
              title="Clear credit insight for SMEs, delivered calmly."
              description="A practical finance SaaS identity for UK limited-company trade-risk screening."
              action={<Badge variant="info">Calm Fin motif</Badge>}
            />
            <div className="brand-attribute-grid">
              {["Calm", "Clarity", "Confidence", "Practical", "Trustworthy", "SME-friendly"].map((attribute) => (
                <Badge variant="info" key={attribute}>{attribute}</Badge>
              ))}
            </div>
          </Card>
        </CalmFinHero>
      </section>

      <BrandSection
        eyebrow="Principles"
        title="Brand principles"
        description="The brand should sit between heavy corporate credit-bureau complexity and lightweight novelty."
      >
        <div className="brand-card-grid">
          {brandPrinciples.map(([title, body]) => (
            <Card key={title} className="brand-principle-card">
              <h3>{title}</h3>
              <p>{body}</p>
            </Card>
          ))}
        </div>
      </BrandSection>

      <BrandSection
        eyebrow="Calm Fin"
        title="Logo and mark direction"
        description="The final logo should use a clean Calm Fin mark with the CreditShark wordmark. This page uses a concept illustration only."
      >
        <div className="brand-two-column">
          <Card variant="mist" className="brand-logo-card">
            <p className="brand-concept-label">Concept illustration - not final logo artwork</p>
            <CalmFinIllustration />
            <strong>Calm Fin above a smooth waterline</strong>
            <span>Visibility, measured awareness and calm control.</span>
          </Card>
          <Card>
            <DetailList
              compact
              items={[
                { label: "Primary logo", value: "Calm Fin mark plus CreditShark wordmark" },
                { label: "Icon direction", value: "Simplified Calm Fin for favicon, app icon and small UI placements" },
                { label: "Monochrome", value: "Must work in black, white and single-colour navy" },
                { label: "Clear space", value: "At least the height of the fin around the mark" },
                { label: "Minimum size", value: "Full logo 140px wide; icon-only 24px in product UI" },
                { label: "Avoid", value: "No teeth, mascot details, distortion, glow, 3D effects or aggressive sharpness" }
              ]}
            />
          </Card>
        </div>
      </BrandSection>

      <BrandSection
        eyebrow="Colour"
        title="Colour system"
        description="Use deep navy, teal, aqua and soft surfaces to support clarity. Risk colour should inform, not dominate."
      >
        <div className="brand-swatch-grid">
          {palette.map(([name, value, usage]) => (
            <Card className="brand-swatch-card" key={name}>
              <span className="brand-swatch" style={{ backgroundColor: value }} aria-hidden="true" />
              <h3>{name}</h3>
              <code>{value}</code>
              <p>{usage}</p>
            </Card>
          ))}
        </div>
        <Card variant="mist" className="brand-guidance-card">
          <SectionHeader title="Functional colour guidance" description="Colour supports clarity, not decoration. Always pair colour with text labels." />
          <div className="brand-functional-colours">
            {functionalColours.map(([name, value, label]) => (
              <div className="brand-functional-colour" key={name}>
                <span className="brand-functional-dot" style={{ backgroundColor: value }} aria-hidden="true" />
                <strong>{name}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
          <Notice variant="caution">
            Avoid harsh red-dominated screens, neon fintech gradients, corporate royal blue and overly complex risk scales.
          </Notice>
        </Card>
      </BrandSection>

      <BrandSection
        eyebrow="Typography"
        title="Typography"
        description="Use the current Inter-first sans-serif stack, with clear hierarchy and readable numerals."
      >
        <Card className="brand-type-sample">
          <p className="eyebrow">Display heading</p>
          <h2>Trade Risk. Calmly Managed.</h2>
          <h3>Company overview and current risk summary</h3>
          <p>
            Body copy should be plain, direct and practical. It should help users understand what matters without
            overwhelming them with raw database output.
          </p>
          <div className="brand-metric-row">
            <MetricCard label="CreditShark Trade Risk Score" value="76" helper="Tabular numerals support dashboard scanning." />
            <MetricCard label="Recommended limit" value="£7,500" helper="Advisory indicator, not a lending decision." />
            <MetricCard label="Metadata" value="Updated today" helper="Small, quiet, but legible." />
          </div>
        </Card>
      </BrandSection>

      <BrandSection
        eyebrow="Voice"
        title="Voice and tone"
        description="CreditShark should sound calm, clear, practical, commercially useful and measured."
      >
        <div className="brand-do-dont">
          <Card className="brand-language-card">
            <h3>Preferred language</h3>
            <ul>
              {preferredLanguage.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Card>
          <Card className="brand-language-card">
            <h3>Avoid language</h3>
            <ul>
              {avoidedLanguage.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </Card>
        </div>
        <Notice variant="info">
          Use advisory phrases such as "may indicate", "worth reviewing", "consider checking" and "review before
          increasing credit terms".
        </Notice>
      </BrandSection>

      <BrandSection
        eyebrow="Components"
        title="Component examples"
        description="These examples are visual references only. They do not call live services or write data."
      >
        <div className="brand-component-grid">
          <Card className="brand-search-example">
            <SectionHeader title="Company search" description="Prominent, simple and trustworthy." />
            <Field label="Company name or number" helper="Concept example only. Use the live search route to check a company.">
              <TextInput readOnly value="00445790" aria-label="Company search concept value" />
            </Field>
            <ActionGroup>
              <Button type="button">Search company</Button>
              <ButtonLink href="/search" variant="secondary">Open live search</ButtonLink>
            </ActionGroup>
          </Card>
          <EvidencePanel
            title="Company summary card"
            description="A fast view of identity, current risk context and source freshness."
            meta={<RiskBadge riskBand="moderate" />}
          >
            <div className="brand-component-metrics">
              <MetricCard label="Status" value="Active" helper="Companies House evidence" />
              <MetricCard label="Watchlist" value="Watching" helper="Monitoring workflow aid" />
            </div>
            <div className="preview-footer">
              <EvidenceChip sourceType="companies_house" label="Companies House evidence" date="source freshness" />
              <EvidenceChip sourceType="model" label="Source-linked evidence" />
              <EvidenceChip sourceType="decision" label="User-recorded decision" />
            </div>
          </EvidencePanel>
          <EvidencePanel title="Watchlist card" description="Useful status without false continuous-monitoring claims.">
            <Notice variant="report">
              Automated monitoring and alerts are planned for a later phase. Current watchlist views are a practical
              workflow aid.
            </Notice>
          </EvidencePanel>
          <EvidencePanel title="Insight panel" description="Explain what a signal means and why it matters.">
            <p>
              Filing and status signals should be connected to practical review points, not presented as a judgement
              about whether to trade.
            </p>
          </EvidencePanel>
        </div>
      </BrandSection>

      <BrandSection
        eyebrow="Reports"
        title="Company reports and risk results"
        description="Results should make the most important point quickly, then support it with structured detail."
      >
        <div className="brand-two-column">
          <Card>
            <h3>Recommended structure</h3>
            <ol className="brand-numbered-list">
              {reportStructure.map((item) => <li key={item}>{item}</li>)}
            </ol>
          </Card>
          <Card variant="mist">
            <h3>Advisory result language</h3>
            <p>
              Use measured wording such as "worth reviewing" and "consider staged credit limits". Do not present
              CreditShark as approving, declining, broking or rating credit.
            </p>
            <ActionGroup>
              <ButtonLink href="/search">Review company</ButtonLink>
              <Button variant="secondary" type="button">Add to watchlist</Button>
            </ActionGroup>
          </Card>
        </div>
      </BrandSection>

      <BrandSection
        eyebrow="Layout"
        title="Layout and spacing"
        description="Create confidence through order, generous whitespace and calm grouping."
      >
        <div className="brand-layout-rhythm">
          <Card variant="elevated">
            <Badge variant="info">Waterline rhythm</Badge>
            <h3>Section rhythm</h3>
            <p>Use clear bands, restrained cards and enough room for the user to scan before reading deeply.</p>
          </Card>
          <Card>
            <Badge variant="evidence">Avoid</Badge>
            <h3>Overloaded surfaces</h3>
            <p>Do not cram tables, badges, action stacks and legal text into the same first viewport.</p>
          </Card>
          <Card variant="mist">
            <Badge variant="manual">Secondary detail</Badge>
            <h3>Audit metadata</h3>
            <p>Keep source timestamps and IDs available, but place them beneath the decision summary.</p>
          </Card>
        </div>
      </BrandSection>

      <BrandSection
        eyebrow="Motion"
        title="Motion and iconography"
        description="Motion should be quiet and useful. Iconography should clarify actions, not decorate the interface."
      >
        <Card>
          <div className="brand-motion-grid">
            <div>
              <h3>Use</h3>
              <p>Soft fades, small upward transitions, smooth card reveals, subtle line movement and simple line icons.</p>
            </div>
            <div>
              <h3>Avoid</h3>
              <p>Distracting motion, mascot-style imagery, dramatic warning animations or novelty visual language.</p>
            </div>
          </div>
        </Card>
      </BrandSection>

      <BrandSection
        eyebrow="Data visualisation"
        title="CreditShark Trade Risk Score"
        description="The brand direction uses a simple 0-100 circular gauge, plain-English rating and source freshness."
      >
        <div className="brand-two-column brand-data-visual">
          <Card variant="elevated">
            <TradeRiskScoreGauge
              score={76}
              rating="Moderate Risk"
              interpretation="Some indicators may need review before increasing exposure."
              lastUpdated="27 May 2026"
            />
            <Notice variant="info" className="mt-4">
              Brand guidance only. This does not change scoring logic, persisted risk labels or model outputs.
            </Notice>
          </Card>
          <Card>
            <SectionHeader title="Preferred score bands" description="Use text labels with colour so meaning is never colour-only." />
            <ResponsiveTableShell>
              <table className="brand-table">
                <thead>
                  <tr>
                    <th>Score</th>
                    <th>Label</th>
                    <th>Interpretation</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreBands.map(([score, label, interpretation]) => (
                    <tr key={score}>
                      <td>{score}</td>
                      <td>{label}</td>
                      <td>{interpretation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ResponsiveTableShell>
          </Card>
        </div>
        <Card variant="mist" className="brand-guidance-card">
          <h3>Supporting chart guidance</h3>
          <p>
            Future visualisations should focus on score movement over time, filing or status change timelines,
            watchlist summaries and risk signal breakdowns. Keep charts lightweight and source-aware.
          </p>
        </Card>
      </BrandSection>

      <BrandSection
        eyebrow="Trust"
        title="Trust, compliance and boundaries"
        description="Legal clarification should be present, readable and used in the right places."
      >
        <Card variant="report">
          <Notice variant="report" title="Approved legal wording">
            {CREDITSHARK_FOOTER_DISCLAIMER}
          </Notice>
          <DetailList
            items={[
              { label: "Use in", value: "Footer, legal/compliance page, terms, product/legal information and relevant report footer." },
              { label: "Do not", value: "Repeat the full legal wording across every card, panel, header or marketing section." },
              { label: "Reports", value: "Reports retain standalone limitations because they may be saved, printed or shared outside the app." }
            ]}
          />
        </Card>
      </BrandSection>

      <BrandSection
        eyebrow="Checklist"
        title="Production checklist"
        description="Use this checklist before shipping new public, app or report surfaces."
      >
        <Card className="brand-checklist-card">
          <ul className="brand-checklist">
            {checklistItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </Card>
      </BrandSection>
    </div>
  );
}

function BrandSection({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="page-shell brand-section">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      {children}
    </section>
  );
}

function CalmFinIllustration() {
  return (
    <svg className="calm-fin-illustration" viewBox="0 0 360 190" role="img" aria-label="Calm Fin concept illustration">
      <rect width="360" height="190" rx="22" fill="#FAFBFC" />
      <path d="M60 121C100 107 139 107 178 121C219 136 260 136 300 121" fill="none" stroke="#6DD1D6" strokeWidth="8" strokeLinecap="round" />
      <path d="M175 115C183 75 202 48 232 34C230 74 215 102 186 121C183 123 178 121 175 115Z" fill="#1CA3A6" />
      <path d="M72 142C108 133 144 133 180 142C216 151 252 151 288 142" fill="none" stroke="#0D2B45" strokeOpacity="0.22" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
