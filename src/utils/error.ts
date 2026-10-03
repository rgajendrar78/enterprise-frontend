import { isAxiosError, isCancel } from "axios";
import type { ApiErrorBody } from "@/types/api";

const FALLBACK = "Something went wrong. Please try again.";

export function extractErrorMessage(error: unknown): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (error.code === "ERR_NETWORK") return "Cannot reach the server. Check your connection.";

    const body = error.response?.data;
    const details = body?.details;
    // Validation failures arrive as a list; the first one is the actionable one.
    if (Array.isArray(details) && typeof details[0] === "string") return details[0];
    return body?.message ?? error.message ?? FALLBACK;
  }

  if (error instanceof Error) return error.message || FALLBACK;
  return FALLBACK;
}

export function isCanceled(error: unknown): boolean {
  return isCancel(error);
}

export function getErrorUrl(error: unknown): string | undefined {
  return isAxiosError(error) ? error.config?.url : undefined;
}

export function getErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

/** The stable `errorCode` from the envelope — branch on this, never on wording. */
export function getErrorCode(error: unknown): string | undefined {
  return isAxiosError<ApiErrorBody>(error) ? error.response?.data?.errorCode : undefined;
}
