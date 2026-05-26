import "dotenv/config";
import { config } from "dotenv";
import { createReportExportRecord, getLatestReportDataForCompany } from "../src/lib/reports/report-service.js";

config({ path: ".env.local", override: true });

const companyNumber = process.argv[2] ?? "00445790";
const report = await getLatestReportDataForCompany(companyNumber);

if (!report.ok) {
  console.error(`Report export smoke test cannot run: ${report.error.code} - ${report.error.message}`);
  console.error("Run the company snapshot and score smoke scripts first if no latest score run exists.");
  process.exitCode = 1;
} else {
  const created = await createReportExportRecord({
    companyNumber,
    actorId: null,
    createdVia: "smoke_report_export_script"
  });

  if (!created.ok) {
    console.error(`Report export smoke test failed: ${created.error.code} - ${created.error.message}`);
    process.exitCode = 1;
  } else {
    console.log(`Company number: ${report.data.company.company_number}`);
    console.log(`Report export id: ${created.data.id}`);
    console.log(`Snapshot id: ${created.data.snapshot_id}`);
    console.log(`Score run id: ${created.data.score_run_id}`);
    console.log(`Report type: ${created.data.report_type}`);
    console.log(`Included sections: ${created.data.included_sections_json.length}`);
  }
}
