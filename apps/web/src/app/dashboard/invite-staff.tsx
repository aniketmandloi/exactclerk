"use client";
import { Button } from "@exactclerk/ui/components/button";
import { Input } from "@exactclerk/ui/components/input";
import { Label } from "@exactclerk/ui/components/label";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function InviteStaff({ dealerId }: { dealerId: string }) {
  const [email, setEmail] = useState("");

  return (
    <form
      className="mt-6 max-w-md space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const { error } = await authClient.organization.inviteMember({
          email,
          role: "staff",
          organizationId: dealerId,
        });
        if (error) {
          toast.error(error.message || error.statusText);
          return;
        }
        setEmail("");
        toast.success(`Invitation sent to ${email}`);
      }}
    >
      <Label htmlFor="staff-email">Invite staff by email</Label>
      <Input
        id="staff-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit">Send invitation</Button>
    </form>
  );
}
