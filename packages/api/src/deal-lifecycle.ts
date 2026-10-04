import type { DealStatus, PriceTier } from "@exactclerk/db/schema";

export const TIER_PRICE_CENTS: Record<PriceTier, number> = {
  standard: 4900,
  lien: 7900,
  complex: 9900,
};

export type IntakeFacts = {
  outOfStateTitle: boolean;
  salvage: boolean;
  bonded: boolean;
  powerOfAttorney: boolean;
  lienPresent: boolean;
};

export const NO_INTAKE_FACTS: IntakeFacts = {
  outOfStateTitle: false,
  salvage: false,
  bonded: false,
  powerOfAttorney: false,
  lienPresent: false,
};

export function priceTier(facts: IntakeFacts): PriceTier {
  if (facts.outOfStateTitle || facts.salvage || facts.bonded || facts.powerOfAttorney) {
    return "complex";
  }
  return facts.lienPresent ? "lien" : "standard";
}

// A Rejection sends the Deal back to Waiting on you under the Chase.
const NEXT_STATUSES: Record<DealStatus, readonly DealStatus[]> = {
  draft: ["waiting_on_you"],
  waiting_on_you: ["ready_for_clerk_review"],
  ready_for_clerk_review: ["waiting_on_you", "ready_to_submit"],
  ready_to_submit: ["submitted"],
  submitted: ["rejected", "cleared"],
  rejected: ["waiting_on_you"],
  cleared: [],
};

export function assertCanMove(
  deal: IntakeFacts & { status: DealStatus; approvedTier: PriceTier | null },
  to: DealStatus,
) {
  if (!NEXT_STATUSES[deal.status].includes(to)) {
    throw new Error(`A Deal cannot move from ${deal.status} to ${to}`);
  }
  if (deal.status === "draft" && deal.approvedTier !== priceTier(deal)) {
    throw new Error("Approve the price before the Deal can move on");
  }
}
