"use client";
import { Button } from "@exactclerk/ui/components/button";
import { Input } from "@exactclerk/ui/components/input";
import { Label } from "@exactclerk/ui/components/label";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

function slugify(name: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 6)}`;
}

export default function CreateDealership() {
  const [name, setName] = useState("");

  return (
    <form
      className="mt-6 max-w-md space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const { error } = await authClient.organization.create({ name, slug: slugify(name) });
        if (error) {
          toast.error(error.message || error.statusText);
          return;
        }
        toast.success("Dealership created");
      }}
    >
      <Label htmlFor="dealership-name">Name your dealership</Label>
      <Input
        id="dealership-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Button type="submit">Create dealership</Button>
    </form>
  );
}
