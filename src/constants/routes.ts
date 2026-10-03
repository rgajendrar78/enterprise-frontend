/** Every path in one place — nothing else may hardcode a route string. */
export const ROUTES = {
  home: "/",
  signIn: "/sign-in",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  users: "/users",
  user: (id: string) => `/users/${id}`,
  account: "/account",
  health: "/api/health",
} as const;

/** Reachable without a session. Exact matches only. */
export const PUBLIC_PATHS: ReadonlySet<string> = new Set([
  ROUTES.signIn,
  ROUTES.forgotPassword,
  ROUTES.resetPassword,
]);

export const RESET_TOKEN_PARAM = "token";

export const DEFAULT_AUTHENTICATED_ROUTE = ROUTES.dashboard;

export const REDIRECT_PARAM = "redirect";
