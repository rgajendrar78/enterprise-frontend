import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/sign-in/components/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  // useSearchParams() needs a boundary or the whole page opts out of prerendering.
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
