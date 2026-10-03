"use client";

import { useRouter } from "next/navigation";
import { API } from "@/api/endpoints";
import { useApiMutation } from "@/api/hooks";
import type { SignInValues } from "@/features/auth/sign-in/data/sign-in-schema";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthSession } from "@/types/user";

export function useSignIn(redirectTo: string) {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  return useApiMutation<AuthSession, SignInValues>({
    method: "post",
    url: API.auth.login,
    onSuccess: (session) => {
      setSession(session);
      // replace, not push: the sign-in page must not be in the back history.
      router.replace(redirectTo);
    },
  });
}
