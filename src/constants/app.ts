/** Mirror of the backend `app.constants.ts`. Change both together. */
export const ROLE = {
  ADMIN: "admin",
  MANAGER: "manager",
  USER: "user",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export const PERMISSION = {
  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DELETE: "users:delete",
  USERS_MANAGE_ROLE: "users:manage-role",
} as const;

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

export const ROLE_LABELS: Record<Role, string> = {
  [ROLE.ADMIN]: "Admin",
  [ROLE.MANAGER]: "Manager",
  [ROLE.USER]: "User",
};

export const ROLE_OPTIONS = Object.values(ROLE).map((role) => ({
  value: role as string,
  label: ROLE_LABELS[role],
}));

export const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  FAILED: "failed",
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

/** Booleans travel through selects and query strings as strings. */
export const BOOLEAN_VALUE = { TRUE: "true", FALSE: "false" } as const;

export const ACTIVE_OPTIONS = [
  { value: BOOLEAN_VALUE.TRUE, label: "Active" },
  { value: BOOLEAN_VALUE.FALSE, label: "Inactive" },
];

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
