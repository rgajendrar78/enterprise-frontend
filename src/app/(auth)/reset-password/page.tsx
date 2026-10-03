import { Suspense } from "react";
import type { Metadata } from "next";
import { ResetPasswordPage } from "@/features/auth/reset-password";

export const metadata: Metadata = { title: "Reset password" };

export default function Page() {
  // useSearchParams() needs a boundary or the whole page opts out of prerendering.
  return (
    <Suspense>
      <ResetPasswordPage />
    </Suspense>
  );
}
