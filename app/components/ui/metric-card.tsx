import { cx } from "./utils";

export function MetricCard({
  label,
  value,
  helper,
  status,
  className
}: {
  label: string;
  value: string | number;
  helper?: string;
  status?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("rounded-[14px] border border-creditshark-border bg-white/85 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-extrabold text-creditshark-muted">{label}</span>
        {status}
      </div>
      <strong className="mt-2 block text-2xl leading-none text-creditshark-navy tabular-nums">{value}</strong>
      {helper ? <p className="mb-0 mt-2 text-sm leading-5 text-creditshark-muted">{helper}</p> : null}
    </div>
  );
}
