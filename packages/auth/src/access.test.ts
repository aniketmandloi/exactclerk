import { describe, expect, it } from "vitest";

import { can } from "./access";
import type { Actor } from "./actor";

const owner: Actor = { kind: "dealer", userId: "u1", dealerId: "d1", role: "owner" };
const staff: Actor = { kind: "dealer", userId: "u2", dealerId: "d1", role: "staff" };
const clerk: Actor = { kind: "exactclerk", userId: "u3", role: "clerk" };

describe("can", () => {
  it("shows billing to a Dealer's owner but not to their staff or ExactClerk staff", () => {
    expect(can(owner, { billing: ["read"] })).toBe(true);
    expect(can(staff, { billing: ["read"] })).toBe(false);
    expect(can(clerk, { billing: ["read"] })).toBe(false);
  });
});
