import { cx } from "./utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex items-start justify-between gap-5", className)}>
      <div>
        {eyebrow ? <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-creditshark-teal">{eyebrow}</p> : null}
        <h2 className="m-0 text-2xl font-extrabold leading-tight text-creditshark-navy">{title}</h2>
        {description ? <p className="mt-2 max-w-3xl text-base leading-7 text-creditshark-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
