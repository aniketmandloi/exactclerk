export type DealerRole = "owner" | "staff";
export type ExactClerkRole = "clerk" | "lead_clerk" | "admin";

export type Actor =
  | { kind: "dealer"; userId: string; dealerId: string; role: DealerRole }
  | { kind: "exactclerk"; userId: string; role: ExactClerkRole };
