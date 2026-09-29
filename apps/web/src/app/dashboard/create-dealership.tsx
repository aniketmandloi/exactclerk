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

function slugify(name: string) {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 6)}`;
}

export default function CreateDealership() {
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <Card className="mx-auto mt-10 w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Set up your dealership</CardTitle>
        <CardDescription>
          Name the dealership your team works under. You can invite staff once it exists.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            const { error } = await authClient.organization.create({ name, slug: slugify(name) });
            setPending(false);
            if (error) {
              toast.error(error.message || error.statusText);
              return;
            }
            toast.success("Dealership created");
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="dealership-name">Dealership name</Label>
            <Input
              id="dealership-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating…" : "Create dealership"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
