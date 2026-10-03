import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type FilterConfig, GlobalFilter } from "@/components/shared/global-filter";
import { usePagination } from "@/hooks/use-pagination";
import type { ListParams } from "@/types/api";

// cmdk measures its list and scrolls the active item; jsdom implements neither.
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
Element.prototype.scrollIntoView = () => {};

const filters: FilterConfig[] = [
  {
    type: "select",
    key: "role",
    label: "Role",
    allLabel: "All roles",
    options: [{ value: "admin", label: "Admin" }],
  },
];

/** The bar drives real pagination state, so the params it sends are what the API gets. */
function renderBar(initial: Partial<ListParams> = {}) {
  const sent: ListParams[] = [];

  function Harness() {
    const pagination = usePagination(initial);
    sent.push(pagination.params);
    return <GlobalFilter pagination={pagination} filters={filters} />;
  }

  render(<Harness />);
  return { params: () => sent[sent.length - 1]! };
}

const trigger = () => screen.getByRole("combobox", { name: "Role" });

describe("GlobalFilter", () => {
  it("reads its declared empty-state label until a value is picked", () => {
    renderBar();
    expect(trigger().textContent).toContain("All roles");
  });

  it("shows the chosen option once one is set", () => {
    renderBar({ role: "admin" });
    expect(trigger().textContent).toContain("Admin");
  });

  it("offers Clear only while something is filtered", () => {
    renderBar();
    expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
  });

  it("drops the param instead of sending the sentinel when All is chosen", () => {
    const bar = renderBar({ role: "admin" });

    fireEvent.click(trigger());
    fireEvent.click(screen.getByText("All roles"));

    expect(bar.params().role).toBeUndefined();
  });
});
