import type { Route } from "next";

export type CompanyWorkspaceTabKey =
  | "summary"
  | "score"
  | "adverse"
  | "history"
  | "reports_decisions";

export interface CompanyWorkspaceTab {
  key: CompanyWorkspaceTabKey;
  label: string;
  href: Route;
  routeSuffixes: string[];
}

const TAB_DEFINITIONS: Array<Omit<CompanyWorkspaceTab, "href"> & { hrefSuffix: string }> = [
  { key: "summary", label: "Summary", hrefSuffix: "", routeSuffixes: [""] },
  { key: "score", label: "Score & Reasons", hrefSuffix: "/score", routeSuffixes: ["/score"] },
  { key: "adverse", label: "Adverse Events", hrefSuffix: "/adverse", routeSuffixes: ["/adverse"] },
  { key: "history", label: "Score History", hrefSuffix: "/history", routeSuffixes: ["/history"] },
  {
    key: "reports_decisions",
    label: "Reports & Decisions",
    hrefSuffix: "/report",
    routeSuffixes: ["/report", "/decision"]
  }
];

export function getCompanyWorkspaceTabs(companyNumber: string): CompanyWorkspaceTab[] {
  const basePath = `/companies/${companyNumber}`;
  return TAB_DEFINITIONS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    href: `${basePath}${tab.hrefSuffix}` as Route,
    routeSuffixes: tab.routeSuffixes
  }));
}

export function getCompanyWorkspaceActiveTab(pathname: string): CompanyWorkspaceTabKey {
  if (pathname.endsWith("/score")) return "score";
  if (pathname.endsWith("/adverse")) return "adverse";
  if (pathname.endsWith("/history")) return "history";
  if (pathname.endsWith("/report") || pathname.endsWith("/decision")) return "reports_decisions";
  return "summary";
}
