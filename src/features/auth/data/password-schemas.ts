import { z } from "zod";
import { PASSWORD_MESSAGE, PASSWORD_PATTERN, VALIDATION } from "@/constants/validation";

/** Every new-password field in the app, so the rules cannot drift between screens. */
const newPassword = z
  .string()
  .min(VALIDATION.PASSWORD_MIN, PASSWORD_MESSAGE)
  .max(VALIDATION.PASSWORD_MAX)
  .regex(PASSWORD_PATTERN, PASSWORD_MESSAGE);

const MISMATCH = "Passwords do not match";

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address").max(VALIDATION.EMAIL_MAX),
});

export const resetPasswordSchema = z
  .object({ password: newPassword, confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    message: MISMATCH,
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: MISMATCH,
    path: ["confirmPassword"],
  })
  .refine((values) => values.currentPassword !== values.password, {
    message: "Choose a password you have not used here before",
    path: ["password"],
  });

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
