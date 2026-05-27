import { PlatformShell } from "../../components/platform-shell";
import { CompanyWorkspaceShell } from "../../components/company-workspace-shell";
import { getCompanyWorkspaceHeader } from "../../../src/lib/company-workspace/company-workspace-service";

export default async function CompanyLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ companyNumber: string }>;
}) {
  const { companyNumber } = await params;
  const header = await getCompanyWorkspaceHeader(companyNumber);

  return (
    <PlatformShell
      note="Company tabs stay inside each workspace. Use Dashboard, Company Search or Watchlist to move between platform areas."
    >
      <CompanyWorkspaceShell header={header}>{children}</CompanyWorkspaceShell>
    </PlatformShell>
  );
}
