"use client";
import { Button } from "@exactclerk/ui/components/button";

import { authClient } from "@/lib/auth-client";

export default function Billing() {
  return (
    <div className="flex gap-2">
      <Button onClick={async () => await authClient.checkout({ slug: "pro" })}>
        Upgrade to Pro
      </Button>
      <Button variant="outline" onClick={async () => await authClient.customer.portal()}>
        Manage Subscription
      </Button>
    </div>
  );
}
