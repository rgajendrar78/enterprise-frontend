"use client";

import type { Permission } from "@/constants/app";
import { hasPermission, useAuthStore } from "@/stores/auth.store";
import type { AuthUser } from "@/types/user";

/** `const { can } = usePermission(); can(PERMISSION.USERS_CREATE)` */
export function usePermission(): { user: AuthUser | null; can: (p: Permission) => boolean } {
  const user = useAuthStore((state) => state.user);
  return { user, can: (permission) => hasPermission(user, permission) };
}
