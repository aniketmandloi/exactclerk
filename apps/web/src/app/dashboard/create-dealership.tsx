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

import Guilloche from "@/components/guilloche";
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
    <Card className="mx-auto mt-6 w-full max-w-md pt-0 sm:mt-12">
      <Guilloche className="text-primary/40" />
      <CardHeader>
        <CardTitle className="font-bold text-2xl [font-stretch:125%]">
          Set up your dealership
        </CardTitle>
        <CardDescription>
          Use the name your dealership trades under. You can invite your staff next.
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
              autoComplete="organization"
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
