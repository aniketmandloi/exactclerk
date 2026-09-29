"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import SignInForm from "@/components/sign-in-form";

// Only same-site paths, so a crafted link cannot send a signed-in user to another site.
function safeNext(next: string | null) {
  return next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function Login() {
  return <SignInForm next={safeNext(useSearchParams().get("next"))} />;
}

export default function LoginPage() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
