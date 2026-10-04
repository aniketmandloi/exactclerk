import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default async function DealsLayout({ children }: { children: React.ReactNode }) {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect("/login");
  }

  return <div className="mx-auto w-full max-w-md space-y-6">{children}</div>;
}
