import { Card } from "./card";
import { cx } from "./utils";

type EvidencePanelVariant = "default" | "companies_house" | "manual" | "decision" | "report";

const variantClasses: Record<EvidencePanelVariant, string> = {
  default: "",
  companies_house: "border-creditshark-teal/30 bg-creditshark-aqua/10",
  manual: "border-[#efd089] bg-[#fff8e8]",
  decision: "border-creditshark-border bg-creditshark-mist/70",
  report: "border-creditshark-teal/25 bg-white"
};

export function EvidencePanel({
  title,
  description,
  meta,
  variant = "default",
  className,
  children
}: {
  title: string;
  description?: string;
  meta?: React.ReactNode;
  variant?: EvidencePanelVariant;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className={cx("grid gap-4", variantClasses[variant], className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-xl font-extrabold text-creditshark-navy">{title}</h2>
          {description ? <p className="mb-0 mt-2 text-sm leading-6 text-creditshark-muted">{description}</p> : null}
        </div>
        {meta ? <div className="shrink-0">{meta}</div> : null}
      </div>
      {children}
    </Card>
  );
}
