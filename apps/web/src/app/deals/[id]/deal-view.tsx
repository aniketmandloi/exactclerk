"use client";
import { Button, buttonVariants } from "@exactclerk/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@exactclerk/ui/components/card";
import { Skeleton } from "@exactclerk/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import Tag from "@/components/tag";
import { trpc } from "@/utils/trpc";

import IntakeForm from "../intake-form";
import {
  type Deal,
  dollars,
  FACT_LABEL,
  INTAKE_FACTS,
  KIND_LABEL,
  STATUS_LABEL,
  TIER_LABEL,
} from "../labels";

function appliedFacts(deal: Deal) {
  return INTAKE_FACTS.filter((fact) => deal[fact]).map((fact) => FACT_LABEL[fact]);
}

function Price({
  deal,
  onApprove,
  pending,
}: {
  deal: Deal;
  onApprove: () => void;
  pending: boolean;
}) {
  const facts = appliedFacts(deal);
  const approved = deal.approvedTier !== null;

  return (
    <Card>
      <CardHeader>
        <CardDescription>Price for this title</CardDescription>
        <CardTitle className="font-bold text-4xl [font-stretch:125%]">
          {dollars(deal.priceCents)}
        </CardTitle>
        <CardAction>
          <Tag>{TIER_LABEL[deal.tier]}</Tag>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {facts.length > 0 ? `Set by: ${facts.join(", ")}.` : "Nothing below adds to the price."}{" "}
          You're charged only when we hand over the prepared packet.
        </p>
        {approved ? (
          <p className="flex items-center gap-2 font-medium text-sm">
            <CircleCheck className="size-4 text-success" aria-hidden="true" />
            You approved {dollars(deal.priceCents)}
          </p>
        ) : (
          <Button className="w-full" onClick={onApprove} disabled={pending}>
            {pending ? "Approving…" : `Approve ${dollars(deal.priceCents)}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function Summary({ deal }: { deal: Deal }) {
  const facts = appliedFacts(deal);

  return (
    <Card>
      <CardContent>
        <dl className="divide-y text-sm">
          <div className="flex justify-between gap-4 py-2">
            <dt className="text-muted-foreground">Price</dt>
            <dd>
              {deal.approvedPriceCents !== null && dollars(deal.approvedPriceCents)}{" "}
              {deal.approvedTier && TIER_LABEL[deal.approvedTier]}
            </dd>
          </div>
          <div className="flex justify-between gap-4 py-2">
            <dt className="text-muted-foreground">Applies</dt>
            <dd className="text-right">{facts.length > 0 ? facts.join(", ") : "None"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export default function DealView({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { data: deal, isPending } = useQuery(trpc.deal.get.queryOptions({ id }));

  const show = (updated: Deal) => queryClient.setQueryData(trpc.deal.get.queryKey({ id }), updated);
  const onError = (error: { message: string }) => toast.error(error.message);

  const update = useMutation(
    trpc.deal.updateIntake.mutationOptions({
      onSuccess: (updated) => {
        if (deal?.approvedTier && !updated.approvedTier) {
          toast.info(`The price is now ${dollars(updated.priceCents)}. Approve it to start.`);
        } else {
          toast.success("Draft saved");
        }
        show(updated);
      },
      onError,
    }),
  );
  const approve = useMutation(trpc.deal.approvePrice.mutationOptions({ onSuccess: show, onError }));
  const start = useMutation(trpc.deal.start.mutationOptions({ onSuccess: show, onError }));

  if (isPending) {
    return (
      <>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </>
    );
  }

  if (!deal) {
    return (
      <div className="space-y-4">
        <h1 className="cn-font-heading font-bold text-2xl [font-stretch:125%]">
          We can't find that Deal
        </h1>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Back to dashboard
        </Link>
      </div>
    );
  }

  const isDraft = deal.status === "draft";

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-primary text-xs uppercase tracking-widest">
            {KIND_LABEL[deal.kind]}
          </p>
          <Tag tone={deal.status === "waiting_on_you" ? "pending" : "neutral"}>
            {STATUS_LABEL[deal.status]}
          </Tag>
        </div>
        <h1 className="break-all font-medium font-mono text-2xl tracking-wider">{deal.vin}</h1>
      </div>

      {isDraft ? (
        <>
          <Price
            deal={deal}
            pending={approve.isPending}
            onApprove={() => approve.mutate({ id, tier: deal.tier })}
          />
          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full"
              disabled={!deal.approvedTier || start.isPending}
              onClick={() => start.mutate({ id })}
            >
              {start.isPending ? "Starting…" : "Start the Deal"}
            </Button>
            {!deal.approvedTier && (
              <p className="text-center text-muted-foreground text-xs">
                Approve the price to start.
              </p>
            )}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Draft</CardTitle>
              <CardDescription>
                Change anything and save. A new price needs approving.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntakeForm
                initial={{
                  vin: deal.vin,
                  kind: deal.kind,
                  outOfStateTitle: deal.outOfStateTitle,
                  salvage: deal.salvage,
                  bonded: deal.bonded,
                  powerOfAttorney: deal.powerOfAttorney,
                  lienPresent: deal.lienPresent,
                }}
                submitLabel="Save draft"
                pending={update.isPending}
                onSubmit={(intake) => update.mutate({ id, ...intake })}
              />
            </CardContent>
          </Card>
        </>
      ) : (
        <Summary deal={deal} />
      )}
    </>
  );
}
