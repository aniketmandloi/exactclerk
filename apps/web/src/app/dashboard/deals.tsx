"use client";
import { buttonVariants } from "@exactclerk/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@exactclerk/ui/components/card";
import { Skeleton } from "@exactclerk/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import Tag from "@/components/tag";
import { trpc } from "@/utils/trpc";

import { KIND_LABEL, STATUS_LABEL } from "../deals/labels";

export default function Deals() {
  const { data: deals, isPending } = useQuery(trpc.deal.list.queryOptions());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deals</CardTitle>
        <CardAction>
          <Link href="/deals/new" className={buttonVariants({ size: "sm" })}>
            Open a Deal
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : deals?.length ? (
          <ul className="divide-y">
            {deals.map((deal) => (
              <li key={deal.id}>
                <Link
                  href={`/deals/${deal.id}`}
                  className="flex min-h-14 items-center justify-between gap-4 py-3 hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono tracking-wider">{deal.vin}</p>
                    <p className="text-muted-foreground text-xs">{KIND_LABEL[deal.kind]}</p>
                  </div>
                  <Tag tone={deal.status === "waiting_on_you" ? "pending" : "neutral"}>
                    {STATUS_LABEL[deal.status]}
                  </Tag>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            No Deals yet. Open one with the vehicle's VIN.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
