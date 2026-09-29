"use client";
import { Button } from "@exactclerk/ui/components/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

export default function AcceptInvitationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  if (!session) {
    return (
      <div className="mx-auto mt-10 max-w-md space-y-4 p-6">
        <p>Sign in with the email address you were invited on to join your dealership.</p>
        <Link href={`/login?next=${encodeURIComponent(`/accept-invitation/${id}`)}`}>
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-md space-y-4 p-6">
      <p>Join the dealership as {session.user.email}?</p>
      <Button
        onClick={async () => {
          const { error } = await authClient.organization.acceptInvitation({ invitationId: id });
          if (error) {
            toast.error(error.message || error.statusText);
            return;
          }
          router.push("/dashboard");
        }}
      >
        Accept invitation
      </Button>
    </div>
  );
}
