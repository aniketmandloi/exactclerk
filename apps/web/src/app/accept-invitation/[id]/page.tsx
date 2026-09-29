"use client";
import { Button, buttonVariants } from "@exactclerk/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@exactclerk/ui/components/card";
import { Skeleton } from "@exactclerk/ui/components/skeleton";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import Guilloche from "@/components/guilloche";
import { authClient } from "@/lib/auth-client";

export default function AcceptInvitationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPending) return <Skeleton className="mx-auto mt-6 h-56 w-full max-w-md sm:mt-12" />;

  if (!session) {
    return (
      <Card className="mx-auto mt-6 w-full max-w-md pt-0 sm:mt-12">
        <Guilloche className="text-primary/40" />
        <CardHeader>
          <CardTitle className="font-bold text-2xl [font-stretch:125%]">You're invited</CardTitle>
          <CardDescription>
            Sign in with the email address you were invited on to join your dealership.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href={`/login?next=${encodeURIComponent(`/accept-invitation/${id}`)}`}
            className={buttonVariants()}
          >
            Sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-6 w-full max-w-md pt-0 sm:mt-12">
      <Guilloche className="text-primary/40" />
      <CardHeader>
        <CardTitle className="font-bold text-2xl [font-stretch:125%]">
          Join the dealership
        </CardTitle>
        <CardDescription>You'll join as {session.user.email}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
        <Button
          disabled={pending}
          onClick={async () => {
            setPending(true);
            setError(null);
            const { error: failure } = await authClient.organization.acceptInvitation({
              invitationId: id,
            });
            if (failure) {
              setPending(false);
              setError(failure.message || failure.statusText);
              return;
            }
            router.push("/dashboard");
          }}
        >
          {pending ? "Joining…" : "Accept invitation"}
        </Button>
      </CardContent>
    </Card>
  );
}
