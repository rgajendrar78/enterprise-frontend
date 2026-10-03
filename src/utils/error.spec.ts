import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import type { ApiErrorBody } from "@/types/api";
import { extractErrorMessage, getErrorStatus } from "@/utils/error";

function apiError(status: number, body: ApiErrorBody): AxiosError<ApiErrorBody> {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, {
    status,
    statusText: "",
    headers: {},
    config,
    data: body,
  });
}

describe("extractErrorMessage", () => {
  it("prefers the first validation detail", () => {
    const error = apiError(400, {
      success: false,
      message: "Validation failed",
      errorCode: "VALIDATION_FAILED",
      details: ["email must be an email", "name is too short"],
    });
    expect(extractErrorMessage(error)).toBe("email must be an email");
  });

  it("falls back to the API message", () => {
    const error = apiError(409, {
      success: false,
      message: "Resource already exists",
      errorCode: "DUPLICATE_RESOURCE",
    });
    expect(extractErrorMessage(error)).toBe("Resource already exists");
    expect(getErrorStatus(error)).toBe(409);
  });

  it("explains a network failure in human terms", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK");
    expect(extractErrorMessage(error)).toContain("Cannot reach the server");
  });

  it("never returns an empty string", () => {
    expect(extractErrorMessage(new Error(""))).toBeTruthy();
    expect(extractErrorMessage("something odd")).toBeTruthy();
  });
});
