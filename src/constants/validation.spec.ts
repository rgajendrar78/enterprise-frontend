import { describe, expect, it } from "vitest";
import { PASSWORD_MESSAGE, PASSWORD_PATTERN, VALIDATION } from "@/constants/validation";

// Fails if the frontend and backend validation constants drift apart.
describe("validation contract", () => {
  it("matches the backend limits", () => {
    expect(VALIDATION).toEqual({
      EMAIL_MAX: 180,
      NAME_MIN: 2,
      NAME_MAX: 120,
      PASSWORD_MIN: 8,
      PASSWORD_MAX: 72,
      SEARCH_MAX: 120,
    });
  });

  it("accepts a password only with a letter and a digit", () => {
    expect(PASSWORD_PATTERN.test("Password1")).toBe(true);
    expect(PASSWORD_PATTERN.test("password")).toBe(false);
    expect(PASSWORD_PATTERN.test("12345678")).toBe(false);
    expect(PASSWORD_MESSAGE).toContain("8-72");
  });
});
