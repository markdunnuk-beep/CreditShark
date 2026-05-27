import { cx } from "./utils";

export function ReportSection({
  title,
  meta,
  className,
  children
}: {
  title?: string;
  meta?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cx("report-section", className)}>
      {title || meta ? (
        <div className="report-section-heading">
          {title ? <h2>{title}</h2> : <span />}
          {meta}
        </div>
      ) : null}
      {children}
    </section>
  );
}
