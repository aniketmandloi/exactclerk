import { type Actor, EXACTCLERK_ROLES, type ExactClerkRole } from "./actor";
import type { createAuth } from "./index";

type Auth = ReturnType<typeof createAuth>;

function isExactClerkRole(role: unknown): role is ExactClerkRole {
  return EXACTCLERK_ROLES.includes(role as ExactClerkRole);
}

export async function getActor(auth: Auth, headers: Headers): Promise<Actor | null> {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;

  const { staffRole } = session.user;
  if (isExactClerkRole(staffRole)) {
    return { kind: "exactclerk", userId: session.user.id, role: staffRole };
  }

  if (!session.session.activeOrganizationId) return null;
  const member = await auth.api.getActiveMember({ headers });
  if (member?.role !== "owner" && member?.role !== "staff") return null;
  return {
    kind: "dealer",
    userId: session.user.id,
    dealerId: member.organizationId,
    role: member.role,
  };
}
