import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, ownerAc } from "better-auth/plugins/organization/access";

import type { Actor } from "./actor";

const ac = createAccessControl({
  ...defaultStatements,
  billing: ["read", "manage"],
});

// A Dealer's own roles. ExactClerk staff roles are not organization roles; they live on the user.
export const dealerRoles = {
  owner: ac.newRole({ ...ownerAc.statements, billing: ["read", "manage"] }),
  staff: ac.newRole({}),
};

export { ac };

type Permission = Parameters<typeof dealerRoles.owner.authorize>[0];

export function can(actor: Actor, permission: Permission): boolean {
  if (actor.kind !== "dealer") return false;
  return dealerRoles[actor.role].authorize(permission).success;
}
