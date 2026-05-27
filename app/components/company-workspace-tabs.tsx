"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getCompanyWorkspaceActiveTab,
  getCompanyWorkspaceTabs
} from "../../src/lib/company-workspace/company-workspace-tabs";

export function CompanyWorkspaceTabs({ companyNumber }: { companyNumber: string }) {
  const pathname = usePathname();
  const activeTab = getCompanyWorkspaceActiveTab(pathname);
  const tabs = getCompanyWorkspaceTabs(companyNumber);

  return (
    <nav className="company-tabs" aria-label="Company workspace tabs">
      {tabs.map((tab) => (
        <Link
          aria-current={activeTab === tab.key ? "page" : undefined}
          className="company-tabs__link"
          href={tab.href}
          key={tab.key}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
