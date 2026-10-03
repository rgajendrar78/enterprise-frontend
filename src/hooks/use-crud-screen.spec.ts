import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCrudScreen } from "@/hooks/use-crud-screen";

interface Row {
  id: string;
}

describe("useCrudScreen", () => {
  it("opens empty for a create and carries the row for an edit", () => {
    const { result } = renderHook(() => useCrudScreen<Row>());

    act(() => result.current.openCreate());
    expect(result.current.isFormOpen).toBe(true);
    expect(result.current.editing).toBeUndefined();
    expect(result.current.formKey).toBe("new");

    act(() => result.current.openEdit({ id: "u1" }));
    expect(result.current.editing).toEqual({ id: "u1" });
    // The key remounts the form, so it never shows the previous row's values.
    expect(result.current.formKey).toBe("u1");
  });

  it("starts on page 1 and goes back to it whenever a filter changes", () => {
    const { result } = renderHook(() => useCrudScreen<Row>());
    expect(result.current.pagination.params.page).toBe(1);

    act(() => result.current.pagination.setPage(4));
    expect(result.current.pagination.params.page).toBe(4);

    act(() => result.current.pagination.setSearch("ada"));
    expect(result.current.pagination.params).toMatchObject({ page: 1, search: "ada" });
  });
});
