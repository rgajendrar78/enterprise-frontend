import type { ComponentType } from "react";
import { Home, Users } from "lucide-react";
import { PERMISSION, type Permission } from "@/constants/app";
import { ROUTES } from "@/constants/routes";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  permission?: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: Home },
  { href: ROUTES.users, label: "Users", icon: Users, permission: PERMISSION.USERS_READ },
];

/** What a path segment is called in the trail. A new screen adds a row here. */
export const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Users",
  account: "My Profile",
};

/** A segment absent from the map is an id, so it is named after what it identifies —
 *  `/users/3f2b` reads "Users / User detail" rather than showing a uuid. */
export const DYNAMIC_SEGMENT_LABELS: Record<string, string> = {
  users: "User detail",
};
