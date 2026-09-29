export const DEALER_ROLES = ["owner", "staff"] as const;
export type DealerRole = (typeof DEALER_ROLES)[number];
export const EXACTCLERK_ROLES = ["clerk", "lead_clerk", "admin"] as const;
export type ExactClerkRole = (typeof EXACTCLERK_ROLES)[number];

export type Actor =
  | { kind: "dealer"; userId: string; dealerId: string; role: DealerRole }
  | { kind: "exactclerk"; userId: string; role: ExactClerkRole };

export function isDealerRole(role: unknown): role is DealerRole {
  return DEALER_ROLES.includes(role as DealerRole);
}

export function isExactClerkRole(role: unknown): role is ExactClerkRole {
  return EXACTCLERK_ROLES.includes(role as ExactClerkRole);
}
