"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { TextField } from "@/components/shared/text-field";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { env } from "@/config/env";
import { DEFAULT_AUTHENTICATED_ROUTE, REDIRECT_PARAM, ROUTES } from "@/constants/routes";
import { AuthCard } from "@/features/auth/components/auth-card";
import { type SignInValues, signInSchema } from "@/features/auth/sign-in/data/sign-in-schema";
import { useSignIn } from "@/features/auth/sign-in/services/use-sign-in";

export function SignInForm() {
  // The gate appends ?redirect=… when it bounces an unauthenticated user.
  const redirectTo = useSearchParams().get(REDIRECT_PARAM) ?? DEFAULT_AUTHENTICATED_ROUTE;
  const signIn = useSignIn(redirectTo);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = form.handleSubmit((values) => signIn.mutate(values));

  return (
    <AuthCard title="Sign in" description={`Continue to ${env.NEXT_PUBLIC_APP_NAME}`}>
      <Form {...form}>
        <form className="space-y-4" onSubmit={(event) => void submit(event)} noValidate>
          <TextField
            control={form.control}
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
          />
          <TextField
            control={form.control}
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
          />

          <div className="text-right">
            <Link
              href={ROUTES.forgotPassword}
              className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" isLoading={signIn.isPending}>
            Sign in
          </Button>
        </form>
      </Form>
    </AuthCard>
  );
}
