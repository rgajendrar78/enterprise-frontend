import { z } from "zod";

/** Defaults are local-dev only and **dropped in a production build**: inlined values
 *  mean a default bakes `localhost` into an image nobody can reconfigure. */
export function buildEnvSchema(isProduction: boolean) {
  const apiUrl = z.url({ protocol: /^https?$/ });
  const appName = z.string().min(1);
  return z.object({
    NEXT_PUBLIC_API_URL: isProduction ? apiUrl : apiUrl.default("http://localhost:4000/api/v1"),
    NEXT_PUBLIC_APP_NAME: isProduction ? appName : appName.default("Enterprise"),
  });
}

export const envSchema = buildEnvSchema(process.env.NODE_ENV === "production");

// Next only inlines *literal* `process.env.X` references — never build the key
// dynamically or the value is `undefined` in the browser.
const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment variables:\n${details}\n\n` +
      "See .env.example. A production build has no defaults: every value must be " +
      "present in the build environment, because NEXT_PUBLIC_* are baked into the " +
      "bundle and cannot be changed at deploy time.",
  );
}

export const env = parsed.data;
