import { z } from "zod";
import { VALIDATION } from "@/constants/validation";

export const profileSchema = z.object({
  name: z.string().min(VALIDATION.NAME_MIN).max(VALIDATION.NAME_MAX),
  imageKey: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
