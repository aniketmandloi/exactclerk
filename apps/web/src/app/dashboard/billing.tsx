"use client";
import { Button } from "@exactclerk/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@exactclerk/ui/components/card";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function Billing() {
  const [pending, setPending] = useState(false);

  async function run(action: () => Promise<unknown>) {
    setPending(true);
    try {
      await action();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>Upgrade your plan or manage your subscription.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button disabled={pending} onClick={() => run(() => authClient.checkout({ slug: "pro" }))}>
          Upgrade to Pro
        </Button>
        <Button
          variant="outline"
          disabled={pending}
          onClick={() => run(() => authClient.customer.portal())}
        >
          Manage subscription
        </Button>
      </CardContent>
    </Card>
  );
}
