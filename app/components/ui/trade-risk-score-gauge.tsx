import { cx } from "./utils";

export function clampTradeRiskScore(score: number | null | undefined): number | null {
  if (score == null || Number.isNaN(score)) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreToGaugeOffset(score: number | null | undefined): number {
  const clamped = clampTradeRiskScore(score) ?? 0;
  return 100 - clamped;
}

export function TradeRiskScoreGauge({
  score,
  rating,
  interpretation,
  lastUpdated,
  className
}: {
  score: number | null | undefined;
  rating: string;
  interpretation?: string;
  lastUpdated?: string | null;
  className?: string;
}) {
  const clamped = clampTradeRiskScore(score);
  const scoreLabel = clamped == null ? "NS" : String(clamped);
  const offset = scoreToGaugeOffset(clamped);
  const accessibleLabel = `CreditShark Trade Risk Score ${scoreLabel} out of 100. Rating: ${rating}.`;

  return (
    <figure
      className={cx("grid justify-items-center gap-3", className)}
      aria-label={accessibleLabel}
      data-ui="trade-risk-score-gauge"
    >
      <div className="relative h-28 w-28">
        <svg className="h-28 w-28 -rotate-90" viewBox="0 0 36 36" role="img" aria-hidden="true">
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(216,231,234,0.95)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            stroke="#1CA3A6"
            strokeDasharray="100"
            strokeDashoffset={offset}
            strokeLinecap="round"
            strokeWidth="3"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <strong className="text-3xl leading-none text-creditshark-navy tabular-nums">{scoreLabel}</strong>
        </div>
      </div>
      <figcaption className="text-center">
        <strong className="block text-sm font-extrabold capitalize text-creditshark-navy">{rating}</strong>
        {interpretation ? <span className="block max-w-48 text-xs leading-5 text-creditshark-muted">{interpretation}</span> : null}
        {lastUpdated ? <span className="block text-xs leading-5 text-creditshark-muted">Last updated {lastUpdated}</span> : null}
      </figcaption>
    </figure>
  );
}
