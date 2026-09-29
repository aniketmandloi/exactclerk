import { Button } from "@exactclerk/ui/components/button";
import { Input } from "@exactclerk/ui/components/input";
import { Label } from "@exactclerk/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

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
            router.push(next);
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
    <div className="mx-auto w-full mt-10 max-w-md p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">Sign in</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  disabled={codeSent}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        {codeSent && (
          <div>
            <form.Field name="code">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Code from your email</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.map((error) => (
                    <p key={error?.message} className="text-red-500">
                      {error?.message}
                    </p>
                  ))}
                </div>
              )}
            </form.Field>
          </div>
        )}

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Submitting..." : codeSent ? "Sign in" : "Email me a code"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
