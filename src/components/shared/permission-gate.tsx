"use client";

import type { ReactNode } from "react";
import type { Permission } from "@/constants/app";
import { usePermission } from "@/hooks/use-permission";

/** Hides dead ends. Not security — the API enforces the same permission. */
export function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { can } = usePermission();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
}
