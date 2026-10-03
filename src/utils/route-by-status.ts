import { toast } from "sonner";
import { API } from "@/api/endpoints";
import { CLIENT_MESSAGE, ERROR_CODE } from "@/constants/errors";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth.store";
import { getErrorCode, getErrorStatus, getErrorUrl } from "@/utils/error";

/** Endpoints where the caller is offering credentials rather than using a session, so a
 *  401 means "wrong", not "expired". `/auth/me` and `/auth/refresh` are not among them. */
const CREDENTIAL_PATHS: readonly string[] = [
  API.auth.login,
  API.auth.forgotPassword,
  API.auth.resetPassword,
];

export function routeByStatus(error: unknown): boolean {
  const status = getErrorStatus(error);
  const code = getErrorCode(error);

  if (code === ERROR_CODE.ACCOUNT_DISABLED) {
    if (useAuthStore.getState().token) signOutTo(ROUTES.signIn);
    return false;
  }

  // A 401 from a form the person just submitted is the answer to it — the password was
  // wrong. Signing out would reload the page and throw that message away unread.
  if (status === 401) {
    if (CREDENTIAL_PATHS.includes(getErrorUrl(error) ?? "")) return false;
    signOutTo(ROUTES.signIn);
    return true;
  }

  if (status === 403) {
    toast.error(CLIENT_MESSAGE.FORBIDDEN);
    return true;
  }

  return false;
}

function signOutTo(path: string): void {
  useAuthStore.getState().signOut();
  if (typeof window !== "undefined") window.location.assign(path);
}
