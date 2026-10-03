"use client";

import { useEffect } from "react";
import { API } from "@/api/endpoints";
import { useApiQuery } from "@/api/hooks";
import { useAuthStore } from "@/stores/auth.store";
import type { AuthUser } from "@/types/user";

/** Re-reads the profile so a permission change lands without a re-login. */
export function useSession(): void {
  const token = useAuthStore((state) => state.token);
  const { data } = useApiQuery<AuthUser>({
    queryKey: ["session"],
    url: API.auth.me,
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (data) useAuthStore.setState({ user: data });
  }, [data]);
}
