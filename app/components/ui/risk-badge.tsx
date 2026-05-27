import { Badge, type BadgeVariant } from "./badge";

export function mapRiskBandToBadgeVariant(riskBand: string | null | undefined): BadgeVariant {
  if (!riskBand) return "neutral";
  if (riskBand === "very_low" || riskBand === "low") return "low";
  if (riskBand === "moderate") return "moderate";
  if (riskBand === "elevated") return "elevated";
  if (riskBand === "high" || riskBand === "very_high") return "high";
  return "neutral";
}

export function formatRiskBandLabel(riskBand: string | null | undefined): string {
  if (!riskBand) return "Not available";
  return riskBand
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function RiskBadge({ riskBand }: { riskBand: string | null | undefined }) {
  return <Badge variant={mapRiskBandToBadgeVariant(riskBand)}>{formatRiskBandLabel(riskBand)}</Badge>;
}
