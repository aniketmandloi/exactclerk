export type DealerRole = "owner" | "staff";
export const EXACTCLERK_ROLES = ["clerk", "lead_clerk", "admin"] as const;
export type ExactClerkRole = (typeof EXACTCLERK_ROLES)[number];

export type Actor =
  | { kind: "dealer"; userId: string; dealerId: string; role: DealerRole }
  | { kind: "exactclerk"; userId: string; role: ExactClerkRole };
