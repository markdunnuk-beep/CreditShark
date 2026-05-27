import type { Route } from "next";
import Link from "next/link";
import { Badge, Notice } from "./ui";

type PlatformNavKey = "dashboard" | "search" | "watchlist";

const NAV_ITEMS: Array<{ key: PlatformNavKey; label: string; href: string; helper: string }> = [
  { key: "dashboard", label: "Dashboard", href: "/app", helper: "Recent trade-risk work" },
  { key: "search", label: "Company Search", href: "/search", helper: "Find a UK company" },
  { key: "watchlist", label: "Watchlist", href: "/watchlist", helper: "Companies under review" }
];

export function PlatformShell({
  active,
  children,
  note = "Recent Checks, Reports and Decisions are summarised on the dashboard for now."
}: {
  active?: PlatformNavKey;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="platform-shell">
      <aside className="platform-sidebar" aria-label="Platform navigation">
        <div className="platform-sidebar__brand">
          <Badge variant="info">Platform</Badge>
          <strong>Trade Risk. Calmly Managed.</strong>
          <small>Clear trade-risk work for UK SMEs.</small>
        </div>
        <nav className="platform-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              aria-current={active === item.key ? "page" : undefined}
              className="platform-nav__link"
              href={item.href as Route}
              key={item.key}
            >
              <span>{item.label}</span>
              <small>{item.helper}</small>
            </Link>
          ))}
        </nav>
        <Notice className="platform-sidebar__note" variant="info">{note}</Notice>
      </aside>
      <div className="platform-content">{children}</div>
    </div>
  );
}
