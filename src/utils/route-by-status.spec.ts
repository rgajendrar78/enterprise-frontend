import { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { API } from "@/api/endpoints";
import { ERROR_CODE } from "@/constants/errors";
import { useAuthStore } from "@/stores/auth.store";
import { routeByStatus } from "@/utils/route-by-status";

vi.mock("@/utils/auth-cookie", () => ({ setAuthCookie: vi.fn(), clearAuthCookie: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const assign = vi.fn();
vi.stubGlobal("location", { assign });

const failure = (status: number, url: string, errorCode?: string) =>
  new AxiosError(
    "failed",
    String(status),
    { url } as InternalAxiosRequestConfig,
    {},
    {
      status,
      data: errorCode ? { errorCode } : {},
      statusText: "",
      headers: {},
      config: { url } as InternalAxiosRequestConfig,
    },
  );

const signedIn = () => useAuthStore.setState({ token: "t", refreshToken: "r", hydrated: true });
const signedOut = () => useAuthStore.setState({ token: null, refreshToken: null, hydrated: true });

afterEach(() => {
  assign.mockClear();
  signedOut();
});

describe("routeByStatus", () => {
  // The bug this guards: a wrong password signed the person out and reloaded the page,
  // so the API's "Invalid email or password" was destroyed before they could read it.
  it("leaves a failed sign-in to be toasted, without signing out", () => {
    const handled = routeByStatus(failure(401, API.auth.login));

    expect(handled).toBe(false);
    expect(assign).not.toHaveBeenCalled();
  });

  it("does the same for the password-reset forms", () => {
    expect(routeByStatus(failure(401, API.auth.forgotPassword))).toBe(false);
    expect(routeByStatus(failure(401, API.auth.resetPassword))).toBe(false);
    expect(assign).not.toHaveBeenCalled();
  });

  it("signs out and redirects on a 401 from an ordinary call", () => {
    signedIn();

    expect(routeByStatus(failure(401, API.users.list))).toBe(true);
    expect(assign).toHaveBeenCalledWith("/sign-in");
    expect(useAuthStore.getState().token).toBeNull();
  });

  // `/auth/me` carries a session rather than offering credentials, so it is not exempt.
  it("treats a 401 from /auth/me as an expired session", () => {
    signedIn();

    expect(routeByStatus(failure(401, API.auth.me))).toBe(true);
    expect(assign).toHaveBeenCalledWith("/sign-in");
  });

  it("ends the session for an account disabled mid-use, but not at the form", () => {
    signedIn();
    expect(routeByStatus(failure(403, API.users.list, ERROR_CODE.ACCOUNT_DISABLED))).toBe(false);
    expect(assign).toHaveBeenCalledWith("/sign-in");

    assign.mockClear();
    signedOut();
    expect(routeByStatus(failure(403, API.auth.login, ERROR_CODE.ACCOUNT_DISABLED))).toBe(false);
    expect(assign).not.toHaveBeenCalled();
  });
});
