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
import { useForm } from "@tanstack/react-form";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Guilloche from "./guilloche";
import Loader from "./loader";

export default function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const { isPending } = authClient.useSession();
  const [codeSent, setCodeSent] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      code: "",
    },
    onSubmit: async ({ value }) => {
      if (!codeSent) {
        const { error } = await authClient.emailOtp.sendVerificationOtp({
          email: value.email,
          type: "sign-in",
        });
        if (error) {
          toast.error(error.message || error.statusText);
          return;
        }
        setCodeSent(true);
        toast.success("We emailed you a sign-in code");
        return;
      }

      await authClient.signIn.emailOtp(
        { email: value.email, otp: value.code },
        {
          onSuccess: () => {
            router.push(next as Route);
            toast.success("Sign in successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.email("Invalid email address"),
        code: codeSent ? z.string().length(6, "Enter the 6-digit code") : z.string(),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <Card className="mx-auto mt-6 w-full max-w-sm pt-0 sm:mt-12">
      <Guilloche className="text-primary/40" />
      <CardHeader>
        <CardTitle className="font-bold text-2xl [font-stretch:125%]">Sign in</CardTitle>
        <CardDescription>
          {codeSent
            ? `Enter the 6-digit code we emailed to ${form.state.values.email}.`
            : "We'll email you a 6-digit code, so there's no password. New here? The same code creates your account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  autoComplete="email"
                  disabled={codeSent}
                  aria-invalid={field.state.meta.errors.length > 0}
                  aria-describedby={`${field.name}-error`}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                <div id={`${field.name}-error`} role="alert">
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-destructive text-sm">
                      {error?.message}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </form.Field>

          {codeSent && (
            <form.Field name="code">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Code from your email</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                    className="h-14 text-center font-mono text-2xl tracking-[0.5em] md:text-2xl"
                    aria-invalid={field.state.meta.errors.length > 0}
                    aria-describedby={`${field.name}-error`}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <div id={`${field.name}-error`} role="alert">
                    {field.state.meta.errors.map((error) => (
                      <p key={error?.message} className="text-destructive text-sm">
                        {error?.message}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </form.Field>
          )}

          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                {isSubmitting
                  ? codeSent
                    ? "Signing in…"
                    : "Sending code…"
                  : codeSent
                    ? "Sign in"
                    : "Email me a code"}
              </Button>
            )}
          </form.Subscribe>

          {codeSent && (
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setCodeSent(false);
                form.setFieldValue("code", "");
              }}
            >
              Use a different email
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
