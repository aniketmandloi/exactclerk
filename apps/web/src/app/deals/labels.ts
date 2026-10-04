import type { AppRouter } from "@exactclerk/api/routers/index";
import type { inferRouterOutputs } from "@trpc/server";

export type Deal = inferRouterOutputs<AppRouter>["deal"]["get"];
export type DealKind = Deal["kind"];
export type IntakeFact =
  | "outOfStateTitle"
  | "salvage"
  | "bonded"
  | "powerOfAttorney"
  | "lienPresent";

export const STATUS_LABEL: Record<Deal["status"], string> = {
  draft: "Draft",
  waiting_on_you: "Waiting on you",
  ready_for_clerk_review: "Ready for clerk review",
  ready_to_submit: "Ready to submit",
  submitted: "Submitted",
  rejected: "Rejected",
  cleared: "Cleared",
};

export const KIND_LABEL: Record<DealKind, string> = {
  retail_sale: "Retail sale",
  trade_in: "Trade-in acquisition",
};

export const TIER_LABEL: Record<Deal["tier"], string> = {
  standard: "Standard",
  lien: "Lien",
  complex: "Complex",
};

export const FACT_LABEL: Record<IntakeFact, string> = {
  outOfStateTitle: "Out-of-state title",
  salvage: "Salvage title",
  bonded: "Bonded title",
  powerOfAttorney: "Sold under power of attorney",
  lienPresent: "Lienholder on the Deal",
};

export const INTAKE_FACTS = Object.keys(FACT_LABEL) as IntakeFact[];

export function dollars(cents: number) {
  return `$${cents / 100}`;
}
