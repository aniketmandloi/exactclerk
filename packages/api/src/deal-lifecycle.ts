import type { PriceTier } from "@exactclerk/db/schema";

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

export function priceTier(facts: IntakeFacts): PriceTier {
  if (facts.outOfStateTitle || facts.salvage || facts.bonded || facts.powerOfAttorney) {
    return "complex";
  }
  return facts.lienPresent ? "lien" : "standard";
}
