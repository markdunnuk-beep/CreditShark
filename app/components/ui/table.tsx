import { cx } from "./utils";

export function ResponsiveTableShell({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("ui-responsive-table rounded-[16px] border border-creditshark-border bg-white/75", className)}>
      {children}
    </div>
  );
}

export function EmptyTableState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[14px] border border-dashed border-creditshark-border bg-creditshark-mist/60 p-4 text-sm leading-6 text-creditshark-muted">
      {children}
    </div>
  );
}
