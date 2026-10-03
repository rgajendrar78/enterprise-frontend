"use client";

import { API } from "@/api/endpoints";
import { useApiMutation } from "@/api/hooks";
import type {
  ChangePasswordValues,
  ForgotPasswordValues,
  ResetPasswordValues,
} from "@/features/auth/data/password-schemas";

/** Non-production convenience: the API returns the link instead of emailing it. */
interface PasswordResetIssued {
  resetToken?: string;
}

export function useForgotPassword(onDone: (issued: PasswordResetIssued) => void) {
  return useApiMutation<PasswordResetIssued, ForgotPasswordValues>({
    method: "post",
    url: API.auth.forgotPassword,
    onSuccess: onDone,
  });
}

export function useResetPassword(onDone: () => void) {
  return useApiMutation<void, ResetPasswordValues & { token: string }>({
    method: "post",
    url: API.auth.resetPassword,
    // The confirmation field never leaves the browser.
    body: ({ token, password }) => ({ token, password }),
    onSuccess: onDone,
  });
}

export function useChangePassword(onDone: () => void) {
  return useApiMutation<void, ChangePasswordValues>({
    method: "post",
    url: API.auth.changePassword,
    body: ({ currentPassword, password }) => ({ currentPassword, newPassword: password }),
    onSuccess: onDone,
  });
}
