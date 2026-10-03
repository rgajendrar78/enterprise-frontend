"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { RESET_TOKEN_PARAM, ROUTES } from "@/constants/routes";
import { AuthCard } from "@/features/auth/components/auth-card";
import {
  type ForgotPasswordValues,
  forgotPasswordSchema,
} from "@/features/auth/data/password-schemas";
import { useForgotPassword } from "@/features/auth/services/use-password";

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  // Only ever set outside production, where the API returns the link instead of
  // emailing it. In production this stays undefined and nothing renders.
  const [devToken, setDevToken] = useState<string>();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const request = useForgotPassword(({ resetToken }) => {
    setSent(true);
    setDevToken(resetToken);
  });

  const submit = form.handleSubmit((values) => request.mutate(values));

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        description="If that address has an account, a reset link is on its way. The link expires in 30 minutes."
        footer={{ href: ROUTES.signIn, label: "Back to sign in" }}
      >
        {devToken ? (
          <div className="bg-muted space-y-2 rounded-md p-3 text-sm">
            <p className="font-medium">No mailer is wired up yet</p>
            <Link
              href={`${ROUTES.resetPassword}?${RESET_TOKEN_PARAM}=${devToken}`}
              className="text-primary block break-all underline underline-offset-4"
            >
              Open the reset link
            </Link>
          </div>
        ) : null}
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password"
      description="We will email you a link to choose a new one."
      footer={{ href: ROUTES.signIn, label: "Back to sign in" }}
    >
      <Form {...form}>
        <form className="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
          />
          <Button type="submit" className="w-full" isLoading={request.isPending}>
            Send reset link
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
