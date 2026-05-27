import type { Metadata, Route } from "next";
import Link from "next/link";
import {
  MANUAL_DATA_INCLUDED_LABEL,
  SOURCE_LINKED_EVIDENCE_LABEL
} from "../../../../src/lib/guardrails";
import { getScoreHistorySummary, type ScoreHistoryViewModel } from "../../../../src/lib/history/score-history-service";
import { getLatestScoreRunForCompany, type ScoreRunResult } from "../../../../src/lib/scoring/scoring-service";
import type { ScoreReasonCode } from "../../../../src/types/creditshark";
import {
  Badge,
  ButtonLink,
  Card,
  DetailList,
  Notice,
  ReasonCodeCard,
  RiskBadge,
  SectionHeader,
  formatReasonGroup,
  formatSignedImpact
} from "../../../components/ui";

export const metadata: Metadata = {
  title: "Score explanation"
};

export const dynamic = "force-dynamic";

export default async function CompanyScorePage({ params }: { params: Promise<{ companyNumber: string }> }) {
  const { companyNumber } = await params;
  const result = await getLatestScoreRunForCompany(companyNumber);

  if (!result.ok) {
    return <ScoreEmptyState companyNumber={companyNumber} message={result.error.message} />;
  }

  const historyResult = await getScoreHistorySummary(result.data.company.company_number);
  return (
    <ScoreExplanation
      data={result.data}
      scoreHistory={historyResult.ok ? historyResult.data : null}
    />
  );
}

function ScoreExplanation({ data, scoreHistory }: { data: ScoreRunResult; scoreHistory: ScoreHistoryViewModel | null }) {
  const groupedReasons = groupReasonsByGroup(data.reasonCodes);
  const manualReasons = data.reasonCodes.filter((reason) => reason.group === "manual_adverse_events");
  const positiveReasons = data.reasonCodes.filter((reason) => reason.direction === "positive");
  const reviewReasons = data.reasonCodes.filter((reason) => reason.direction === "negative" || reason.direction === "neutral");
  const missingReasons = data.reasonCodes.filter((reason) => reason.direction === "missing");
  const hasMissingData = data.missingDataFlags.length > 0 || missingReasons.length > 0;

  return (
    <section className="company-tab-page">
      <Card className="tab-section tab-section--primary">
        <div className="tab-intro">
          <div>
          <p className="eyebrow">{SOURCE_LINKED_EVIDENCE_LABEL}</p>
            <h2>Score drivers and reasons</h2>
            <p className="note">
              Reason codes explain the latest advisory score using source-linked evidence, confidence and missing-data context.
            </p>
          </div>
          <div className="compact-score-strip">
            <RiskBadge riskBand={data.scoreRun.riskBand} />
            <span>Run: {formatDateTime(data.scoreRun.runAt)}</span>
            <Link href={historyRoute(data.company.company_number)}>Score history</Link>
          </div>
        </div>
        {scoreHistory?.previous ? (
          <p className="note">Previous check: {scoreHistory.previous.score ?? "NS"}. {scoreHistory.movement.message}</p>
        ) : null}
        <p className="note">{confidenceExplanation(data.scoreRun.confidenceLevel, hasMissingData)}</p>
      </Card>

      {manualReasons.length > 0 ? (
        <Notice variant="manual" title={MANUAL_DATA_INCLUDED_LABEL}>
          Manual entries are shown separately from Companies House evidence.
        </Notice>
      ) : null}

      <Card className="tab-section">
        <SectionHeader title="Top score drivers" action={<Badge>Source-linked</Badge>} />
        <div className="driver-columns driver-columns--three">
          <ReasonDriverGroup title="Positive drivers" reasons={positiveReasons.slice(0, 4)} emptyText="No positive drivers were emitted." />
          <ReasonDriverGroup title="Review factors" reasons={reviewReasons.slice(0, 4)} emptyText="No review factors were emitted." />
          <ReasonDriverGroup title="Missing or limited data" reasons={missingReasons.slice(0, 4)} emptyText="No missing-data reason codes were emitted." />
        </div>
      </Card>

      <Card className="tab-section reason-group-compact">
        <SectionHeader title="Full reason-code detail" action={<Badge>{data.reasonCodes.length} reason codes</Badge>} />
        <div className="factor-groups">
          {Array.from(groupedReasons.entries()).map(([group, reasons]) => (
            <div className={`factor-group factor-group--${group}`} key={group}>
              <h3>{formatGroupLabel(group)}</h3>
              <div className="reason-list">
                {reasons.map((reason) => <ReasonRow key={reason.code} reason={reason} />)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="tab-section">
        <SectionHeader title="Missing data" action={<Badge>Confidence: {formatValue(data.scoreRun.confidenceLevel)}</Badge>} />
        {data.missingDataFlags.length > 0 ? (
          <ul className="flag-list">
            {data.missingDataFlags.map((flag) => <li key={flag}>{flag}</li>)}
          </ul>
        ) : (
          <p className="note">No missing-data flags were emitted for this score run.</p>
        )}
        <p className="note">Missing data is shown because it limits what the scoring model can inspect. It can reduce confidence even when the advisory score can still be calculated.</p>
        <details className="secondary-audit-details">
          <summary>Audit details</summary>
          <DetailList compact items={[
            { label: "Snapshot id", value: data.snapshot.id },
            { label: "Score run id", value: data.scoreRun.id },
            { label: "Model version", value: data.modelVersion.version },
            { label: "Source fetched", value: formatDateTime(data.snapshot.source_fetched_at) }
          ]} />
        </details>
      </Card>
    </section>
  );
}

function ScoreEmptyState({ companyNumber, message }: { companyNumber: string; message: string }) {
  return (
    <section className="page-shell">
      <div className="placeholder-stack">
        <p className="eyebrow">Score explanation</p>
        <h1 className="page-title">No score run available</h1>
        <div className="empty-state">
          <strong>{companyNumber}</strong>
          <div>{message}</div>
        </div>
        <div className="actions">
          <ButtonLink href={`/companies/${companyNumber}`}>
            Back to profile
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

function ReasonRow({ reason }: { reason: ScoreReasonCode }) {
  return <ReasonCodeCard reason={reason} />;
}

function ReasonDriverGroup({ title, reasons, emptyText }: { title: string; reasons: ScoreReasonCode[]; emptyText: string }) {
  return (
    <div className="driver-group">
      <h3>{title}</h3>
      {reasons.length > 0 ? (
        <div className="reason-preview">
          {reasons.map((reason) => (
            <div className={`reason-pill reason-pill--${reason.direction}`} key={reason.code}>
              <span>{reason.label}</span>
              <strong>{formatSignedImpact(reason.weight)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="note">{emptyText}</p>
      )}
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

function groupReasonsByGroup(reasons: ScoreReasonCode[]): Map<string, ScoreReasonCode[]> {
  return reasons.reduce((groups, reason) => {
    const existing = groups.get(reason.group) ?? [];
    existing.push(reason);
    groups.set(reason.group, existing);
    return groups;
  }, new Map<string, ScoreReasonCode[]>());
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

function formatRiskBand(value: string): string {
  return value.replace(/_/g, " ");
}

function formatGroup(value: string): string {
  return value.replace(/_/g, " ");
}

function formatGroupLabel(value: string): string {
  return formatReasonGroup(value);
}

function confidenceExplanation(value: string | null | undefined, hasMissingData: boolean): string {
  const confidence = formatValue(value).toLowerCase();
  if (hasMissingData) return `The ${confidence} confidence level reflects missing or limited evidence in this score run.`;
  return `The ${confidence} confidence level reflects the available snapshot evidence and current model version.`;
}

function historyRoute(companyNumber: string): Route {
  return `/companies/${companyNumber}/history` as Route;
}
