/** Runtime knobs. A number that appears in two files belongs here, not inline. */
export const HTTP = {
  TIMEOUT_MS: 30_000,
} as const;

export const QUERY = {
  STALE_TIME_MS: 30_000,
  GC_TIME_MS: 5 * 60_000,
  MAX_RETRIES: 2,
} as const;

export const UI = {
  SEARCH_DEBOUNCE_MS: 300,
  /** A search box over three options is furniture, not help. */
  SEARCHABLE_OPTIONS: 8,
  TABLE_SKELETON_ROWS: 5,
} as const;

export const AUTH = {
  COOKIE_NAME: "auth_token",
  COOKIE_MAX_AGE_SECONDS: 60 * 60 * 24 * 7,
} as const;

export const LOGGING = {
  REQUEST_ID_HEADER: "x-request-id",
} as const;

export const CALENDAR = {
  YEARS_BACK: 100,
  YEARS_FORWARD: 10,
} as const;

export const THEME = {
  STORAGE_KEY: "theme",
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const;

export type ThemePreference = typeof THEME.LIGHT | typeof THEME.DARK | typeof THEME.SYSTEM;

export const DISCARD_CHANGES_PROMPT = {
  title: "Discard unsaved changes?",
  description: "Your edits on this form have not been saved yet.",
  confirmLabel: "Discard",
  cancelLabel: "Keep editing",
} as const;

export const SIGN_OUT_PROMPT = {
  title: "Sign out?",
  description: "You will need to sign in again to get back in.",
  confirmLabel: "Sign out",
  cancelLabel: "Stay signed in",
  tone: "default",
} as const;
