import type { Permission, Role } from "@/constants/app";

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Set when the row is soft-deleted; only ever non-null with `?includeDeleted=true`. */
  deletedAt: string | null;
  profile: {
    name: string;
    imageUrl: string | null;
  } | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  permissions: Permission[];
  profile: {
    name: string;
    imageUrl: string | null;
  } | null;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}
