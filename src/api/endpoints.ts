/** Every URL the app calls. No string literals in feature code. */
export const API = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    me: "/auth/me",
    profile: "/auth/profile",
    profileAvatar: "/auth/profile/avatar",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    changePassword: "/auth/change-password",
  },
  users: {
    list: "/users",
    byId: (id: string) => `/users/${id}`,
    role: (id: string) => `/users/${id}/role`,
    restore: (id: string) => `/users/${id}/restore`,
    avatar: (id: string) => `/users/${id}/avatar`,
  },
} as const;
