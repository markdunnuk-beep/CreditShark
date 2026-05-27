"use server";

import { redirect } from "next/navigation";
import { createDecisionRecord, type DecisionRecordInput } from "../../../../src/lib/decisions/decision-service";

export async function createDecisionRecordAction(companyNumber: string, formData: FormData): Promise<void> {
  const result = await createDecisionRecord(companyNumber, formInput(formData), {
    createdVia: "decision_page"
  });

  redirect(`/companies/${companyNumber}/decision?${result.ok ? "created=1" : `error=${encodeURIComponent(result.error.message)}`}`);
}

function formInput(formData: FormData): DecisionRecordInput {
  return {
    decision: String(formData.get("decision") ?? ""),
    requested_limit: optionalString(formData.get("requested_limit")),
    approved_limit: optionalString(formData.get("approved_limit")),
    currency: optionalString(formData.get("currency")) ?? "GBP",
    reviewer_notes: optionalString(formData.get("reviewer_notes")),
    override_reason: optionalString(formData.get("override_reason"))
  };
}

function optionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
