import { z } from "zod";
import { VALIDATION } from "@/constants/validation";

export const signInSchema = z.object({
  email: z.email("Enter a valid email address").max(VALIDATION.EMAIL_MAX),
  password: z
    .string()
    .min(VALIDATION.PASSWORD_MIN, `At least ${VALIDATION.PASSWORD_MIN} characters`)
    .max(VALIDATION.PASSWORD_MAX),
});

export type SignInValues = z.infer<typeof signInSchema>;
