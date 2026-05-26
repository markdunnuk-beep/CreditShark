import "dotenv/config";
import { config } from "dotenv";
import { createCompanySnapshotFromCompaniesHouse } from "../src/lib/companies/company-snapshot-service.js";
import {
  createManualAdverseEvent,
  deactivateManualAdverseEvent,
  getManualAdverseEventsForCompany
} from "../src/lib/adverse/manual-adverse-event-service.js";
import { runAndPersistScoreForLatestSnapshot } from "../src/lib/scoring/scoring-service.js";

config({ path: ".env.local", override: true });

const companyNumber = process.argv[2] ?? "00445790";

const existing = await getManualAdverseEventsForCompany(companyNumber);
if (!existing.ok && existing.error.code === "company_not_found") {
  const snapshot = await createCompanySnapshotFromCompaniesHouse(companyNumber, {
    actorId: null,
    createdVia: "smoke_manual_adverse_script"
  });
  if (!snapshot.ok) {
    console.error(`Manual adverse smoke test failed while creating company snapshot: ${snapshot.error.code} - ${snapshot.error.message}`);
    process.exitCode = 1;
  }
}

if (!process.exitCode) {
  const created = await createManualAdverseEvent(companyNumber, {
    eventType: "adverse_note",
    eventDate: new Date().toISOString().slice(0, 10),
    amount: null,
    currency: "GBP",
    status: "note_only",
    sourceNote: "CreditShark smoke test note only - not a real adverse claim.",
    evidenceReference: "smoke-test",
    isActive: true
  }, {
    actorId: null,
    createdVia: "smoke_manual_adverse_script"
  });

  if (!created.ok) {
    console.error(`Manual adverse smoke test failed while creating test note: ${created.error.code} - ${created.error.message}`);
    process.exitCode = 1;
  } else {
    const score = await runAndPersistScoreForLatestSnapshot(companyNumber, {
      actorId: null,
      createdVia: "smoke_manual_adverse_script"
    });

    if (!score.ok) {
      console.error(`Manual adverse smoke test failed while scoring: ${score.error.code} - ${score.error.message}`);
      process.exitCode = 1;
    } else {
      const manualReasonCount = score.data.reasonCodes.filter((reason) => reason.group === "manual_adverse_events").length;
      console.log(`Company number: ${score.data.company.company_number}`);
      console.log(`Manual event id: ${created.data.id}`);
      console.log(`Score run id: ${score.data.scoreRun.id}`);
      console.log(`Score: ${score.data.scoreRun.score ?? "not scored"}`);
      console.log(`Risk band: ${score.data.scoreRun.riskBand}`);
      console.log(`Manual reason codes: ${manualReasonCount}`);
    }

    const deactivated = await deactivateManualAdverseEvent(created.data.id, "Smoke test cleanup", {
      actorId: null,
      createdVia: "smoke_manual_adverse_script"
    });
    console.log(`Smoke test manual event deactivated: ${deactivated.ok ? "yes" : "no"}`);
  }
}
