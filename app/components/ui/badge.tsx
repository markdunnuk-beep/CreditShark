import { cx } from "./utils";

export type BadgeVariant =
  | "neutral"
  | "info"
  | "low"
  | "moderate"
  | "elevated"
  | "high"
  | "manual"
  | "evidence";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-white text-creditshark-muted border-creditshark-border",
  info: "bg-creditshark-mist text-creditshark-navy border-creditshark-border",
  low: "bg-risk-low/10 text-[#18764d] border-risk-low/25",
  moderate: "bg-risk-moderate/15 text-[#8b5a12] border-risk-moderate/30",
  elevated: "bg-risk-elevated/15 text-[#7a4b0b] border-risk-elevated/30",
  high: "bg-risk-high/12 text-[#9d2f2f] border-risk-high/30",
  manual: "bg-[#fff4d8] text-[#7a4b0b] border-[#efd089]",
  evidence: "bg-creditshark-mist text-creditshark-navy border-creditshark-border"
};

export function Badge({
  variant = "neutral",
  className,
  children
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-extrabold capitalize", variantClasses[variant], className)}>
      {children}
    </span>
  );
}
