import { Badge, type BadgeVariant } from "./badge";

type EvidenceSource = "companies_house" | "manual" | "model" | "report" | "decision" | string;

function evidenceVariant(sourceType: EvidenceSource): BadgeVariant {
  if (sourceType.includes("manual")) return "manual";
  if (sourceType.includes("companies_house")) return "evidence";
  if (sourceType.includes("model")) return "info";
  if (sourceType.includes("decision")) return "info";
  if (sourceType.includes("report")) return "info";
  return "neutral";
}

export function EvidenceChip({
  sourceType,
  label,
  date
}: {
  sourceType: EvidenceSource;
  label: string;
  date?: string | null;
}) {
  return (
    <Badge variant={evidenceVariant(sourceType)}>
      {label}{date ? ` - ${date}` : ""}
    </Badge>
  );
}
