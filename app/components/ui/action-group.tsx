import { cx } from "./utils";

export function ActionGroup({
  align = "start",
  compact = false,
  className,
  children
}: {
  align?: "start" | "end";
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cx(
        "flex flex-wrap gap-2",
        align === "end" ? "justify-end" : "justify-start",
        compact ? "items-center" : "items-start",
        className
      )}
    >
      {children}
    </div>
  );
}
