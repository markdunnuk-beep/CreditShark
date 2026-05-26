"use server";

import { redirect } from "next/navigation";
import {
  createManualAdverseEvent,
  deactivateManualAdverseEvent,
  supersedeManualAdverseEvent,
  type ManualAdverseEventInput
} from "../../../../src/lib/adverse/manual-adverse-event-service";
import { runAndPersistScoreForLatestSnapshot } from "../../../../src/lib/scoring/scoring-service";

export async function createManualAdverseEventAction(companyNumber: string, formData: FormData): Promise<void> {
  const result = await createManualAdverseEvent(companyNumber, formInput(formData), {
    createdVia: "manual_adverse_page"
  });
  redirect(`/companies/${companyNumber}/adverse?${result.ok ? "created=1" : `error=${encodeURIComponent(result.error.message)}`}`);
}

export async function supersedeManualAdverseEventAction(companyNumber: string, eventId: string, formData: FormData): Promise<void> {
  const result = await supersedeManualAdverseEvent(eventId, formInput(formData), {
    createdVia: "manual_adverse_page"
  });
  redirect(`/companies/${companyNumber}/adverse?${result.ok ? "superseded=1" : `error=${encodeURIComponent(result.error.message)}`}`);
}

export async function deactivateManualAdverseEventAction(companyNumber: string, eventId: string, formData: FormData): Promise<void> {
  const result = await deactivateManualAdverseEvent(eventId, String(formData.get("deactivation_reason") ?? ""), {
    createdVia: "manual_adverse_page"
  });
  redirect(`/companies/${companyNumber}/adverse?${result.ok ? "deactivated=1" : `error=${encodeURIComponent(result.error.message)}`}`);
}

export async function rerunScoreFromAdversePageAction(companyNumber: string): Promise<void> {
  const result = await runAndPersistScoreForLatestSnapshot(companyNumber, {
    createdVia: "manual_adverse_page"
  });

  if (!result.ok) {
    redirect(`/companies/${companyNumber}/adverse?error=${encodeURIComponent(result.error.message)}`);
  }

  redirect(`/companies/${companyNumber}/score?manual=1`);
}

function formInput(formData: FormData): ManualAdverseEventInput {
  return {
    eventType: String(formData.get("event_type") ?? ""),
    status: String(formData.get("status") ?? ""),
    eventDate: optionalString(formData.get("event_date")),
    amount: optionalString(formData.get("amount")),
    currency: optionalString(formData.get("currency")) ?? "GBP",
    sourceNote: String(formData.get("source_note") ?? ""),
    evidenceReference: optionalString(formData.get("evidence_reference")),
    isActive: true
  };
}

function optionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
