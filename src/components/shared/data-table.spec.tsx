import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { type Column, DataTable } from "@/components/shared/data-table";
import { usePagination } from "@/hooks/use-pagination";

interface Row {
  id: string;
  name: string;
}

const columns: Column<Row>[] = [{ key: "name", header: "Name", cell: (row) => row.name }];
const rows: Row[] = [
  { id: "1", name: "Ada" },
  { id: "2", name: "Grace" },
];

const givenPagination = () => renderHook(() => usePagination()).result.current;
const givenSortedPagination = () =>
  renderHook(() => usePagination({ sort: "name:asc" })).result.current;

const givenQuery = (state: Partial<Record<string, unknown>> = {}) =>
  ({
    data: { items: rows, meta: { page: 1, limit: 20, totalCount: 2, totalPages: 1 } },
    isPending: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
    ...state,
  }) as unknown as NonNullable<Parameters<typeof DataTable<Row>>[0]["query"]>;

describe("DataTable", () => {
  it("shows the empty state only when loading has finished", () => {
    const { rerender } = render(<DataTable columns={columns} rows={undefined} isLoading />);
    expect(screen.queryByText("Nothing here yet")).toBeNull();

    rerender(<DataTable columns={columns} rows={[]} />);
    expect(screen.getByText("Nothing here yet")).toBeTruthy();
  });

  it("renders one row per item and the pagination summary from the query", () => {
    render(<DataTable columns={columns} query={givenQuery()} pagination={givenPagination()} />);

    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.getByText("Grace")).toBeTruthy();
    expect(screen.getByText("1–2 of 2")).toBeTruthy();
    expect(screen.getByRole("button", { name: /previous/i }).hasAttribute("disabled")).toBe(true);
  });

  /** "No users found" for a request that never arrived sends people hunting a filter. */
  it("says the load failed instead of showing an empty result", () => {
    const refetch = vi.fn();
    render(
      <DataTable
        columns={columns}
        query={givenQuery({ data: undefined, isError: true, refetch })}
      />,
    );

    expect(screen.getByText("Could not load this list")).toBeTruthy();
    expect(screen.queryByText("Nothing here yet")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("keeps the rows when a refetch fails", () => {
    render(<DataTable columns={columns} query={givenQuery({ isError: true })} />);

    expect(screen.getByText("Ada")).toBeTruthy();
    expect(screen.queryByText("Could not load this list")).toBeNull();
  });

  it("marks itself busy while the next page loads", () => {
    const { container } = render(
      <DataTable columns={columns} query={givenQuery({ isFetching: true })} />,
    );

    expect(container.firstElementChild?.getAttribute("aria-busy")).toBe("true");
  });

  it("asks pagination to sort and announces the column that is sorted", () => {
    const toggleSort = vi.fn();
    const pagination = { ...givenSortedPagination(), toggleSort };
    const sortable: Column<Row>[] = [{ ...columns[0]!, sortable: true }];

    render(<DataTable columns={sortable} query={givenQuery()} pagination={pagination} />);

    expect(screen.getByRole("columnheader").getAttribute("aria-sort")).toBe("ascending");

    fireEvent.click(screen.getByRole("button", { name: /name/i }));
    // The wire format is `usePagination`'s alone — the table only names the column.
    expect(toggleSort).toHaveBeenCalledWith("name");
  });

  it("opens a clickable row from the keyboard", () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} query={givenQuery()} onRowClick={onRowClick} />);

    fireEvent.keyDown(screen.getByText("Ada").closest("tr")!, { key: "Enter" });

    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });
});
