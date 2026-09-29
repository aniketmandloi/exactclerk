"use client";
import { Button } from "@exactclerk/ui/components/button";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

import Billing from "./billing";
import CreateDealership from "./create-dealership";
import InviteStaff from "./invite-staff";

export default function Dashboard() {
  const privateData = useQuery(trpc.privateData.queryOptions());
  const { data: member, isPending } = authClient.useActiveMember();
  const { data: dealership } = authClient.useActiveOrganization();

  if (isPending) return null;

  if (!member) {
    return <CreateDealership />;
  }

  const isOwner = member.role === "owner";

  return (
    <>
      <p>API: {privateData.data?.message}</p>
      <p>
        {dealership?.name} ({member.role})
      </p>
      {isOwner && <InviteStaff dealerId={member.organizationId} />}
      {isOwner && <Billing />}
      <Button
        variant="outline"
        onClick={async () => {
          await authClient.signOut();
          window.location.assign("/");
        }}
      >
        Sign out
      </Button>
    </>
  );
}
