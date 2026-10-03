import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePagination } from "@/hooks/use-pagination";

describe("usePagination", () => {
  it("returns to page 1 whenever the result set changes", () => {
    const { result } = renderHook(() => usePagination());

    act(() => result.current.setPage(4));
    expect(result.current.params.page).toBe(4);

    act(() => result.current.setSearch("ada"));
    expect(result.current.params).toMatchObject({ page: 1, search: "ada" });

    act(() => result.current.setPage(3));
    act(() => result.current.setFilter("role", "admin"));
    expect(result.current.params).toMatchObject({ page: 1, role: "admin" });
  });

  it("drops an empty search instead of sending search=", () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.setSearch(""));
    expect(result.current.params.search).toBeUndefined();
  });

  /** The `key:direction` format is this hook's alone — a table only names the column. */
  it("starts a new sort ascending and flips the one already sorted", () => {
    const { result } = renderHook(() => usePagination());

    act(() => result.current.toggleSort("name"));
    expect(result.current.params.sort).toBe("name:asc");
    expect(result.current.sortDirection("name")).toBe("asc");

    act(() => result.current.toggleSort("name"));
    expect(result.current.params.sort).toBe("name:desc");

    act(() => result.current.toggleSort("createdAt"));
    expect(result.current.params.sort).toBe("createdAt:asc");
    // Only one column is sorted at a time, so the previous one reports nothing.
    expect(result.current.sortDirection("name")).toBeUndefined();
  });

  it("returns to page 1 when the sort changes, not to an empty page 7", () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.setPage(7));
    act(() => result.current.toggleSort("name"));
    expect(result.current.params.page).toBe(1);
  });

  it("keeps the initial params for reset", () => {
    const { result } = renderHook(() => usePagination({ limit: 50 }));
    act(() => result.current.setPage(9));
    act(() => result.current.reset());
    expect(result.current.params).toEqual({ page: 1, limit: 50 });
  });
});
