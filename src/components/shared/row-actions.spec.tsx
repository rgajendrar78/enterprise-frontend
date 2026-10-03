import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Trash2 } from "lucide-react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "@/components/shared/confirm-provider";
import { type RowAction, rowActionsColumn } from "@/components/shared/row-actions";

interface Row {
  id: string;
  name: string;
}

const row: Row = { id: "1", name: "Ada" };

beforeAll(() => {
  // Radix drives its menus with pointer events jsdom does not implement.
  window.PointerEvent = MouseEvent as unknown as typeof PointerEvent;
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
});

const openMenu = (actions: RowAction<Row>[]) => {
  render(<ConfirmProvider>{rowActionsColumn(actions).cell(row)}</ConfirmProvider>);
  fireEvent.pointerDown(screen.getByRole("button", { name: "Actions" }), {
    button: 0,
    ctrlKey: false,
    pointerType: "mouse",
  });
};

const deleteAction = (onSelect: (row: Row) => void): RowAction<Row> => ({
  label: "Delete",
  icon: Trash2,
  destructive: true,
  confirm: (target) => ({ title: `Delete ${target.name}?`, confirmLabel: "Delete" }),
  onSelect,
});

/** The menu owns the question, so no screen can ship a one-click delete. */
describe("row action confirmation", () => {
  it("asks first and does nothing until the answer comes back", async () => {
    const onSelect = vi.fn();
    openMenu([deleteAction(onSelect)]);

    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(await screen.findByText("Delete Ada?")).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("runs the action once it is confirmed", async () => {
    const onSelect = vi.fn();
    openMenu([deleteAction(onSelect)]);

    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(row));
  });

  it("drops it when the answer is no", async () => {
    const onSelect = vi.fn();
    openMenu([deleteAction(onSelect)]);

    fireEvent.click(await screen.findByRole("menuitem", { name: "Delete" }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByText("Delete Ada?")).toBeNull());
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("runs an action with no `confirm` straight away", async () => {
    const onSelect = vi.fn();
    openMenu([{ label: "View", onSelect }]);

    fireEvent.click(await screen.findByRole("menuitem", { name: "View" }));

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(row));
  });
});
