import axios, {
  type AxiosAdapter,
  AxiosError,
  CanceledError,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "@/api/client";
import { ROLE } from "@/constants/app";
import { useAuthStore } from "@/stores/auth.store";
import { logger } from "@/utils/logger";

vi.mock("@/utils/auth-cookie", () => ({ setAuthCookie: vi.fn(), clearAuthCookie: vi.fn() }));
vi.mock("@/utils/logger", () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const session = (suffix: string) => ({
  accessToken: `access-${suffix}`,
  refreshToken: `refresh-${suffix}`,
  user: {
    id: "u1",
    email: "a@b.c",
    role: ROLE.ADMIN,
    permissions: [],
    profile: {
      name: "A",
      imageUrl: null,
    },
  },
});

const ok = (config: InternalAxiosRequestConfig) =>
  Promise.resolve({
    data: { success: true, data: null },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });

const unauthorized = (config: InternalAxiosRequestConfig) =>
  Promise.reject(
    new AxiosError(
      "Unauthorized",
      "401",
      config,
      {},
      {
        status: 401,
        data: {},
        statusText: "Unauthorized",
        headers: {},
        config,
      },
    ),
  );

function adapterExpiringAfter(count: number) {
  let seen = 0;
  return vi.fn<AxiosAdapter>((config) => (seen++ < count ? unauthorized(config) : ok(config)));
}

describe("http refresh", () => {
  const original = http.defaults.adapter;

  beforeEach(() => {
    const { accessToken, refreshToken, user } = session("first");
    useAuthStore.setState({ token: accessToken, refreshToken, user, hydrated: true });
  });

  afterEach(() => {
    http.defaults.adapter = original;
    vi.restoreAllMocks();
  });

  it("stores the rotated refresh token, not just the new access token", async () => {
    http.defaults.adapter = adapterExpiringAfter(1);
    const post = vi.spyOn(axios, "post").mockResolvedValue({ data: { data: session("second") } });

    await expect(http.get("/users")).resolves.toBeDefined();

    expect(post).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().token).toBe("access-second");
    expect(useAuthStore.getState().refreshToken).toBe("refresh-second");
  });

  // Parallel 401s must not fire parallel refreshes: the second would present a token
  // the first already rotated away, and the whole session would end instead.
  it("refreshes once for concurrent 401s", async () => {
    http.defaults.adapter = adapterExpiringAfter(2);
    const post = vi
      .spyOn(axios, "post")
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { data: session("second") } }), 10),
          ) as ReturnType<typeof axios.post>,
      );

    await Promise.all([http.get("/users"), http.get("/users/1")]);

    expect(post).toHaveBeenCalledTimes(1);
  });

  it("signs out when the refresh is rejected too", async () => {
    http.defaults.adapter = adapterExpiringAfter(1);
    vi.spyOn(axios, "post").mockRejectedValue(new Error("refresh rejected"));

    await expect(http.get("/users")).rejects.toBeDefined();

    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  // Refreshing after a failed sign-in would replay the credentials endpoint, and a
  // 401 there is the answer, not an expired session.
  it("does not try to refresh an auth call", async () => {
    http.defaults.adapter = adapterExpiringAfter(1);
    const post = vi.spyOn(axios, "post").mockResolvedValue({ data: { data: session("second") } });

    await expect(http.get("/auth/login")).rejects.toBeDefined();

    expect(post).not.toHaveBeenCalled();
  });

  it("says what failed in the message, not only in the fields", async () => {
    vi.mocked(logger.warn).mockClear();
    http.defaults.adapter = adapterExpiringAfter(1);
    vi.spyOn(axios, "post").mockRejectedValue(new Error("refresh rejected"));

    await expect(http.get("/auth/login")).rejects.toBeDefined();

    expect(logger.warn).toHaveBeenCalledWith(
      "GET /auth/login → 401",
      expect.objectContaining({ status: 401, method: "GET", url: "/auth/login" }),
    );
  });

  it("says nothing when the app itself cancelled the request", async () => {
    vi.mocked(logger.warn).mockClear();
    vi.mocked(logger.error).mockClear();
    http.defaults.adapter = vi.fn<AxiosAdapter>((config) =>
      Promise.reject(new CanceledError("canceled", undefined, config)),
    );

    await expect(http.get("/users")).rejects.toBeDefined();

    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("reports even a 500 as a warning, never a client error", async () => {
    vi.mocked(logger.error).mockClear();
    vi.mocked(logger.warn).mockClear();
    http.defaults.adapter = vi.fn<AxiosAdapter>((config) =>
      Promise.reject(
        new AxiosError(
          "Server error",
          "500",
          config,
          {},
          {
            status: 500,
            data: {},
            statusText: "Server Error",
            headers: {},
            config,
          },
        ),
      ),
    );

    await expect(http.get("/users")).rejects.toBeDefined();

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      "GET /users → 500",
      expect.objectContaining({ status: 500 }),
    );
  });
});
