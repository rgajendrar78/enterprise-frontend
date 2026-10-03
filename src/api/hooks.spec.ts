import { type ReactNode, createElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApiMutation } from "@/api/hooks";

const request = vi.fn();
vi.mock("@/api/client", () => ({ http: { request: (...args: unknown[]) => request(...args) } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

describe("useApiMutation", () => {
  beforeEach(() => {
    request.mockReset();
    request.mockResolvedValue({ data: { success: true, message: "ok", data: null } });
  });

  /** A scalar addresses the URL — `DELETE /users/:id`. Sent as a body it becomes a
   *  bare string `express.json()` rejects with a 400, and the delete never happens. */
  it("does not send a scalar variable as the request body", async () => {
    const { result } = renderHook(
      () => useApiMutation<void, string>({ method: "delete", url: (id) => `/users/${id}` }),
      { wrapper },
    );

    result.current.mutate("abc-123");

    await waitFor(() => expect(request).toHaveBeenCalled());
    expect(request.mock.calls[0]?.[0]).toMatchObject({
      method: "delete",
      url: "/users/abc-123",
      data: undefined,
    });
  });

  it("still sends an object payload", async () => {
    const { result } = renderHook(
      () => useApiMutation<void, { name: string }>({ method: "post", url: "/users" }),
      { wrapper },
    );

    result.current.mutate({ name: "Ada" });

    await waitFor(() => expect(request).toHaveBeenCalled());
    expect(request.mock.calls[0]?.[0]).toMatchObject({ data: { name: "Ada" } });
  });

  it("lets `body` pick what to send when the variables carry the id too", async () => {
    const { result } = renderHook(
      () =>
        useApiMutation<void, { id: string; data: { name: string } }>({
          method: "patch",
          url: ({ id }) => `/users/${id}`,
          body: ({ data }) => data,
        }),
      { wrapper },
    );

    result.current.mutate({ id: "abc-123", data: { name: "Ada" } });

    await waitFor(() => expect(request).toHaveBeenCalled());
    expect(request.mock.calls[0]?.[0]).toMatchObject({
      url: "/users/abc-123",
      data: { name: "Ada" },
    });
  });

  // Held in a ref for `onSuccess`, the second response overwrites the first's wording
  // and one person is told twice about the other row.
  it("toasts each mutation's own message when two overlap", async () => {
    vi.mocked(toast.success).mockClear();
    const responses: Record<string, string> = {
      "/users/one": "User one deleted",
      "/users/two": "User two deleted",
    };
    request.mockImplementation(({ url }: { url: string }) =>
      Promise.resolve({ data: { success: true, message: responses[url], data: null } }),
    );

    const { result } = renderHook(
      () => useApiMutation<void, string>({ method: "delete", url: (id) => `/users/${id}` }),
      { wrapper },
    );

    result.current.mutate("one");
    result.current.mutate("two");

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(2));
    expect(vi.mocked(toast.success).mock.calls.flat()).toEqual(
      expect.arrayContaining(["User one deleted", "User two deleted"]),
    );
  });
});
