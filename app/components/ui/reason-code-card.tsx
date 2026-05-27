import type { ScoreReasonCode } from "../../../src/types/creditshark";
import { Badge } from "./badge";
import { EvidenceChip } from "./evidence-chip";
import { cx, formatUiValue } from "./utils";

const directionClasses: Record<string, string> = {
  positive: "border-risk-low/30 bg-risk-low/10",
  negative: "border-risk-high/30 bg-risk-high/10",
  missing: "border-risk-moderate/35 bg-risk-moderate/12",
  neutral: "border-creditshark-border bg-creditshark-mist/60"
};

export function formatSignedImpact(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function formatReasonGroup(value: string): string {
  const labels: Record<string, string> = {
    company_status: "Company status",
    company_age: "Company age",
    filing_behaviour: "Filing behaviour",
    financial_strength: "Financial data",
    charges: "Charges",
    manual_adverse_events: "Manual data included",
    director_psc_signals: "Director and PSC context",
    sic_sector_weighting: "Sector context",
    data_completeness: "Data completeness"
  };
  return labels[value] ?? formatUiValue(value);
}

export function ReasonCodeCard({ reason, compact = false }: { reason: ScoreReasonCode; compact?: boolean }) {
  return (
    <article className={cx("rounded-[14px] border p-4", directionClasses[reason.direction] ?? directionClasses.neutral)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-base font-extrabold text-creditshark-navy">{reason.label}</h3>
            <EvidenceChip sourceType={reason.sourceType} label={formatUiValue(reason.sourceType)} date={reason.sourceDate} />
            {reason.group === "manual_adverse_events" ? <Badge variant="manual">Manual data</Badge> : null}
          </div>
          {compact ? null : <p className="mb-0 mt-2 text-sm leading-6 text-creditshark-muted">{reason.explanation}</p>}
        </div>
        <div className="grid min-w-[4.5rem] justify-items-end">
          <strong className="text-2xl leading-none text-creditshark-navy tabular-nums">{formatSignedImpact(reason.weight)}</strong>
          <span className="mt-1 text-xs font-extrabold uppercase tracking-[0.04em] text-creditshark-muted">{formatUiValue(reason.impact)}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-creditshark-muted">
        <span>Code: {reason.code}</span>
        <span>Group: {formatReasonGroup(reason.group)}</span>
        <span>Weight: {formatSignedImpact(reason.weight)}</span>
        {reason.sourceId ? <span>Source id: {reason.sourceId}</span> : null}
      </div>
    </article>
  );
}
