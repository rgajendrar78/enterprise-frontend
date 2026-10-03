import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildEnvSchema, envSchema } from "@/config/env";

describe("env contract", () => {
  it("documents every variable in .env.example", () => {
    const documented = new Set(
      readFileSync(".env.example", "utf8")
        .split("\n")
        .filter((line) => !line.trimStart().startsWith("#") && line.includes("="))
        .map((line) => line.split("=")[0]?.trim() ?? ""),
    );
    const missing = Object.keys(envSchema.shape).filter((key) => !documented.has(key));
    expect(missing).toEqual([]);
  });

  it("rejects a non-url API base", () => {
    expect(envSchema.safeParse({ NEXT_PUBLIC_API_URL: "localhost:4000" }).success).toBe(false);
  });

  // A production build with no env used to succeed and bake localhost into the
  // bundle. Every variable must be present, or the build fails.
  it("has no defaults in a production build", () => {
    const result = buildEnvSchema(true).safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_APP_NAME"]),
    );
  });

  it("still defaults outside production, so `pnpm dev` needs no file", () => {
    expect(buildEnvSchema(false).parse({}).NEXT_PUBLIC_API_URL).toBe(
      "http://localhost:4000/api/v1",
    );
  });
});
