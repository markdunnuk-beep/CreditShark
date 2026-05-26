import type { Metadata } from "next";
import Link from "next/link";
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
                CreditShark
              </Link>
              <nav aria-label="Primary navigation" className="main-nav">
                <Link className="nav-link" href="/search">
                  Search
                </Link>
                <span aria-disabled="true" className="nav-link" title="Coming soon">
                  Watchlist
                </span>
                <span aria-disabled="true" className="nav-link" title="Coming soon">
                  Reports
                </span>
              </nav>
              <span className="guardrail-pill">Advisory company screening</span>
            </div>
          </header>
          <main className="site-main">{children}</main>
          <footer className="site-footer">
            <div className="site-footer__inner">
              CreditShark provides advisory trade-risk screening for UK limited companies only. It does not provide consumer credit reports,
              regulated credit ratings, lending decisions, credit broking, debt advice or debt collection services.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
