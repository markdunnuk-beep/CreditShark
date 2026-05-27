import { cx } from "./utils";

export type DetailListItem = {
  label: string;
  value: string | number | React.ReactNode;
};

export function DetailList({
  items,
  compact = false,
  className
}: {
  items: DetailListItem[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <dl
      className={cx(
        "grid gap-3",
        compact ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {items.map((item) => (
        <div className="min-w-0 rounded-[12px] border border-creditshark-border bg-white/70 p-3" key={item.label}>
          <dt className="text-xs font-extrabold uppercase tracking-[0.04em] text-creditshark-muted">{item.label}</dt>
          <dd className="mt-1 break-words text-sm font-bold text-creditshark-navy">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
