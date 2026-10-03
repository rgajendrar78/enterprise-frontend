import { z } from "zod";
import { BOOLEAN_VALUE, ROLE } from "@/constants/app";
import { PASSWORD_MESSAGE, PASSWORD_PATTERN, VALIDATION } from "@/constants/validation";

const baseSchema = z.object({
  name: z.string().min(VALIDATION.NAME_MIN).max(VALIDATION.NAME_MAX),
  email: z.email("Enter a valid email address").max(VALIDATION.EMAIL_MAX),
  role: z.enum([ROLE.ADMIN, ROLE.MANAGER, ROLE.USER]),
  isActive: z.enum([BOOLEAN_VALUE.TRUE, BOOLEAN_VALUE.FALSE]),
  password: z.string().optional(),
});

const passwordSchema = z
  .string()
  .min(VALIDATION.PASSWORD_MIN, PASSWORD_MESSAGE)
  .max(VALIDATION.PASSWORD_MAX)
  .regex(PASSWORD_PATTERN, PASSWORD_MESSAGE);

/** Password is required on create only; the API has no generic password update. */
export const userFormSchema = (mode: "create" | "edit") =>
  mode === "create" ? baseSchema.extend({ password: passwordSchema }) : baseSchema;

export type UserFormValues = z.infer<typeof baseSchema>;
