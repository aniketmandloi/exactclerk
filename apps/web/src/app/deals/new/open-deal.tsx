"use client";
import { NO_INTAKE_FACTS } from "@exactclerk/api/deal-lifecycle";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

import IntakeForm from "../intake-form";

export default function OpenDeal() {
  const router = useRouter();
  const open = useMutation(
    trpc.deal.open.mutationOptions({
      onSuccess: (deal) => router.push(`/deals/${deal.id}`),
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <>
      <div className="space-y-2">
        <p className="font-mono text-primary text-xs uppercase tracking-widest">New Deal</p>
        <h1 className="cn-font-heading font-bold text-3xl [font-stretch:125%]">Open a Deal</h1>
        <p className="text-muted-foreground text-sm">
          It's saved as a Draft, so you can come back and finish it. You'll see the price before any
          work starts.
        </p>
      </div>
      <IntakeForm
        initial={{ vin: "", kind: "retail_sale", ...NO_INTAKE_FACTS }}
        submitLabel="Save as Draft"
        pending={open.isPending || open.isSuccess}
        onSubmit={(intake) => open.mutate(intake)}
      />
    </>
  );
}
