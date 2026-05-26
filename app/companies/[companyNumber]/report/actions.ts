"use server";

import { redirect } from "next/navigation";
import { createReportExportRecord } from "../../../../src/lib/reports/report-service";

export async function createReportExportAction(companyNumber: string): Promise<void> {
  const result = await createReportExportRecord({
    companyNumber,
    createdVia: "report_preview_route"
  });

  if (!result.ok) {
    redirect(`/companies/${companyNumber}/report?error=${encodeURIComponent(result.error.message)}`);
  }

  redirect(`/companies/${companyNumber}/report?exported=1&exportId=${result.data.id}`);
}
