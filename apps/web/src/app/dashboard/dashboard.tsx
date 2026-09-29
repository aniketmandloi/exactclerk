"use client";
import { Card, CardDescription, CardHeader, CardTitle } from "@exactclerk/ui/components/card";
import { Skeleton } from "@exactclerk/ui/components/skeleton";

import { authClient } from "@/lib/auth-client";

import Billing from "./billing";
import CreateDealership from "./create-dealership";
import InviteStaff from "./invite-staff";

export default function Dashboard() {
  const { data: member, isPending } = authClient.useActiveMember();
  const { data: dealership } = authClient.useActiveOrganization();

  if (isPending) return <Skeleton className="h-24 w-full" />;

  if (!member) {
    return <CreateDealership />;
  }

  const isOwner = member.role === "owner";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{dealership?.name}</CardTitle>
          <CardDescription>You are signed in as {isOwner ? "an owner" : "staff"}.</CardDescription>
        </CardHeader>
      </Card>
      {isOwner && (
        <div className="grid gap-4 md:grid-cols-2">
          <InviteStaff dealerId={member.organizationId} />
          <Billing />
        </div>
      )}
    </div>
  );
}
