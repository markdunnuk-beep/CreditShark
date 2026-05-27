"use server";

import { revalidatePath } from "next/cache";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { addCompanyToWatchlist, removeCompanyFromWatchlist } from "../../src/lib/watchlist/watchlist-service";

export async function addCompanyToWatchlistAction(companyNumber: string, formData: FormData): Promise<void> {
  const result = await addCompanyToWatchlist(companyNumber, {
    watchReason: optionalString(formData.get("watch_reason"))
  }, {
    createdVia: "company_profile_route"
  });

  revalidatePath("/watchlist");
  revalidatePath(`/companies/${companyNumber}`);
  redirect(`/companies/${companyNumber}?${result.ok ? "watchlist=added" : `watchlistError=${encodeURIComponent(result.error.message)}`}`);
}

export async function removeCompanyFromWatchlistAction(companyNumber: string, redirectTo: "profile" | "watchlist" = "profile"): Promise<void> {
  const result = await removeCompanyFromWatchlist(companyNumber, {
    createdVia: redirectTo === "watchlist" ? "watchlist_route" : "company_profile_route"
  });

  revalidatePath("/watchlist");
  revalidatePath(`/companies/${companyNumber}`);

  if (redirectTo === "watchlist") {
    redirect(`/watchlist?${result.ok ? "removed=1" : `error=${encodeURIComponent(result.error.message)}`}` as Route);
  }

  redirect(`/companies/${companyNumber}?${result.ok ? "watchlist=removed" : `watchlistError=${encodeURIComponent(result.error.message)}`}`);
}

function optionalString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
