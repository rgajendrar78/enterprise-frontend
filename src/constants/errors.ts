/** Copy the client owns, because no API response carries it. Everything else a person
 *  reads comes from the envelope's `message` — the server is the single source. */
export const CLIENT_MESSAGE = {
  FORBIDDEN: "You do not have access to that.",
  LIST_FAILED: "Could not load this list",
  LIST_FAILED_HINT: "The request did not reach the server, or it answered with an error.",
} as const;

/** Mirrors the backend `errors.ts`. Only codes the UI branches on belong here —
 *  everything else is shown by message alone. */
export const ERROR_CODE = {
  ACCOUNT_DISABLED: "ACCOUNT_DISABLED",
  INVALID_RESET_TOKEN: "INVALID_RESET_TOKEN",
} as const;
