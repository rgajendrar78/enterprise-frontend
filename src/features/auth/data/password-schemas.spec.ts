import { describe, expect, it } from "vitest";
import { changePasswordSchema, resetPasswordSchema } from "@/features/auth/data/password-schemas";

const strong = "Password1";

/** The rules the API also enforces — a form that disagrees just lies to people. */
describe("password schemas", () => {
  it("requires the confirmation to match", () => {
    expect(
      resetPasswordSchema.safeParse({ password: strong, confirmPassword: strong }).success,
    ).toBe(true);

    const mismatch = resetPasswordSchema.safeParse({
      password: strong,
      confirmPassword: "Password2",
    });
    expect(mismatch.success).toBe(false);
    expect(mismatch.error?.issues[0]?.path).toEqual(["confirmPassword"]);
  });

  it("rejects a password without a letter and a digit", () => {
    expect(
      resetPasswordSchema.safeParse({ password: "password", confirmPassword: "password" }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({ password: "Short1", confirmPassword: "Short1" }).success,
    ).toBe(false);
  });

  it("refuses to set the current password again", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: strong,
      password: strong,
      confirmPassword: strong,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["password"]);
  });

  it("accepts a genuine change", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: strong,
        password: "Password2",
        confirmPassword: "Password2",
      }).success,
    ).toBe(true);
  });
});
