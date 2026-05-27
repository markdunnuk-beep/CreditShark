import { cx } from "./utils";

type CardVariant = "default" | "elevated" | "mist" | "report";

const variantClasses: Record<CardVariant, string> = {
  default: "bg-white/90 border-creditshark-border",
  elevated: "bg-white/95 border-creditshark-border shadow-creditshark",
  mist: "bg-creditshark-mist/80 border-creditshark-border",
  report: "bg-creditshark-white border-creditshark-border"
};

export function Card({
  variant = "default",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  variant?: CardVariant;
  children: React.ReactNode;
}) {
  return (
    <section className={cx("rounded-creditshark border p-6", variantClasses[variant], className)} {...props}>
      {children}
    </section>
  );
}
