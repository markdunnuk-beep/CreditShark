import { cx } from "./utils";

export type NoticeVariant = "info" | "caution" | "manual" | "missing" | "report" | "error" | "success";

const variantClasses: Record<NoticeVariant, string> = {
  info: "border-creditshark-border bg-creditshark-mist/75 text-creditshark-ink",
  caution: "border-risk-moderate/35 bg-risk-moderate/12 text-[#7a4b0b]",
  manual: "border-[#efd089] bg-[#fff4d8] text-[#7a4b0b]",
  missing: "border-risk-moderate/35 bg-risk-moderate/12 text-[#7a4b0b]",
  report: "border-creditshark-teal/30 bg-creditshark-aqua/15 text-creditshark-navy",
  error: "border-risk-high/35 bg-risk-high/10 text-[#8f2e2e]",
  success: "border-risk-low/30 bg-risk-low/10 text-[#18764d]"
};

export function Notice({
  variant = "info",
  title,
  children,
  className,
  role
}: {
  variant?: NoticeVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  role?: "alert" | "status";
}) {
  return (
    <div
      className={cx("rounded-[14px] border px-4 py-3 text-sm leading-6", variantClasses[variant], className)}
      role={role ?? (variant === "error" ? "alert" : undefined)}
    >
      {title ? <strong className="mb-1 block text-sm font-extrabold">{title}</strong> : null}
      <div>{children}</div>
    </div>
  );
}
