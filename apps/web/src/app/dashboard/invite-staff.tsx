"use client";
import { Button } from "@exactclerk/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@exactclerk/ui/components/card";
import { Input } from "@exactclerk/ui/components/input";
import { Label } from "@exactclerk/ui/components/label";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function InviteStaff({ dealerId }: { dealerId: string }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite staff</CardTitle>
        <CardDescription>Send an email invitation to join your dealership.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            const { error } = await authClient.organization.inviteMember({
              email,
              role: "staff",
              organizationId: dealerId,
            });
            setPending(false);
            if (error) {
              toast.error(error.message || error.statusText);
              return;
            }
            setEmail("");
            toast.success(`Invitation sent to ${email}`);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send invitation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
