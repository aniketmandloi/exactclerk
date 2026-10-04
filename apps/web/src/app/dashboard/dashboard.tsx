"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@exactclerk/ui/components/card";
import { Skeleton } from "@exactclerk/ui/components/skeleton";
import { cn } from "@exactclerk/ui/lib/utils";

import Tag from "@/components/tag";
import { authClient } from "@/lib/auth-client";

import CreateDealership from "./create-dealership";
import Deals from "./deals";
import InviteStaff from "./invite-staff";

export default function Dashboard() {
  const { data: member, isPending } = authClient.useActiveMember();
  const { data: dealership, refetch } = authClient.useActiveOrganization();

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!member) {
    return <CreateDealership />;
  }

  const isOwner = member.role === "owner";
  const pendingInvitations =
    dealership?.invitations.filter((invitation) => invitation.status === "pending") ?? [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="font-mono text-primary text-xs uppercase tracking-widest">Your dealership</p>
        {dealership ? (
          <h1 className="cn-font-heading font-bold text-3xl [font-stretch:125%]">
            {dealership.name}
          </h1>
        ) : (
          <Skeleton className="h-9 w-56" />
        )}
        <p className="text-muted-foreground text-sm">
          You're signed in as {isOwner ? "the owner" : "staff"}.
        </p>
      </div>

      <Deals />

      <div className={cn("grid items-start gap-6", isOwner && "lg:grid-cols-[1fr_22rem]")}>
        <Card>
          <CardHeader>
            <CardTitle>Team</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {dealership?.members.map((person) => (
                <li key={person.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {person.user.name || person.user.email}
                      {person.userId === member.userId && (
                        <span className="font-normal text-muted-foreground"> (you)</span>
                      )}
                    </p>
                    {person.user.name && (
                      <p className="truncate text-muted-foreground text-xs">{person.user.email}</p>
                    )}
                  </div>
                  <Tag>{person.role}</Tag>
                </li>
              ))}
              {pendingInvitations.map((invitation) => (
                <li key={invitation.id} className="flex items-center justify-between gap-4 py-3">
                  <p className="min-w-0 truncate text-muted-foreground">{invitation.email}</p>
                  <Tag tone="pending">Invited</Tag>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {isOwner && (
          <InviteStaff
            dealerId={member.organizationId}
            dealershipName={dealership?.name}
            onInvited={() => refetch()}
          />
        )}
      </div>
    </div>
  );
}
