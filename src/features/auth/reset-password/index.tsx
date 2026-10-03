"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { RESET_TOKEN_PARAM, ROUTES } from "@/constants/routes";
import { AuthCard } from "@/features/auth/components/auth-card";
import {
  type ResetPasswordValues,
  resetPasswordSchema,
} from "@/features/auth/data/password-schemas";
import { useResetPassword } from "@/features/auth/services/use-password";

export function ResetPasswordPage() {
  const router = useRouter();
  const token = useSearchParams().get(RESET_TOKEN_PARAM);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const reset = useResetPassword(() => router.replace(ROUTES.signIn));
  const submit = form.handleSubmit((values) => reset.mutate({ ...values, token: token ?? "" }));

  // A link that arrives without its token is broken; say so instead of failing
  // on submit. An expired or used one still fails at the API, with its message.
  if (!token) {
    return (
      <AuthCard
        title="Link is not valid"
        description="This reset link is missing its token. Request a new one — they expire after 30 minutes."
        footer={{ href: ROUTES.forgotPassword, label: "Request a new link" }}
      />
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      description="You will be signed out everywhere else once you use it."
      footer={{ href: ROUTES.signIn, label: "Back to sign in" }}
    >
      <Form {...form}>
        <form className="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
          <TextField
            control={form.control}
            name="password"
            label="New password"
            type="password"
            autoComplete="new-password"
          />
          <TextField
            control={form.control}
            name="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
          />
          <Button type="submit" className="w-full" isLoading={reset.isPending}>
            Update password
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
