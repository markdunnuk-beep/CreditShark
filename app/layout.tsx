import type { Metadata, Route } from "next";
import Link from "next/link";
import { CREDITSHARK_FOOTER_DISCLAIMER } from "../src/lib/guardrails";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CreditShark",
    template: "%s | CreditShark"
  },
  description: "Advisory UK limited-company trade-risk screening using source-linked evidence and transparent scoring.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-GB">
      <body>
        <div className="app-shell">
          <header className="site-header">
            <div className="site-header__inner">
              <Link className="wordmark" href="/">
                <span className="wordmark__main">CreditShark</span>
                <span className="wordmark__sub">Company risk checks</span>
              </Link>
              <nav aria-label="Primary navigation" className="main-nav">
                <Link className="nav-link" href={"/app" as Route}>
                  Dashboard
                </Link>
                <Link className="nav-link" href="/search">
                  Search
                </Link>
                <Link className="nav-link" href={"/watchlist" as Route}>
                  Watchlist
                </Link>
              </nav>
              <span className="guardrail-pill">Advisory screening</span>
            </div>
          </header>
          <main className="site-main">{children}</main>
          <footer className="site-footer">
            <div className="site-footer__inner">
              {CREDITSHARK_FOOTER_DISCLAIMER}
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
