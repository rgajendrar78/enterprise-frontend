import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "@/components/shared/confirm-provider";
import { FormDialog } from "@/components/shared/form-dialog";
import { TextField } from "@/components/shared/text-field";

interface Values {
  name: string;
}

function Harness({
  onOpenChange,
  onSubmit,
}: {
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Values) => Promise<unknown>;
}) {
  const form = useForm<Values>({ defaultValues: { name: "" } });

  return (
    <ConfirmProvider>
      <FormDialog
        open
        onOpenChange={onOpenChange}
        title="Edit thing"
        form={form}
        onSubmit={onSubmit}
      >
        <TextField control={form.control} name="name" label="Name" />
      </FormDialog>
    </ConfirmProvider>
  );
}

const typeName = (value: string) =>
  fireEvent.change(screen.getByLabelText("Name"), { target: { value } });

describe("FormDialog", () => {
  it("closes once the save resolves", async () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} onSubmit={vi.fn().mockResolvedValue(null)} />);

    typeName("Ada");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  /** The API refused it — closing here would throw the edit away with nothing to retry. */
  it("stays open and keeps the input when the save fails", async () => {
    const onOpenChange = vi.fn();
    const onSubmit = vi.fn().mockRejectedValue(new Error("409"));
    render(<Harness onOpenChange={onOpenChange} onSubmit={onSubmit} />);

    typeName("Ada");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Name")).toHaveProperty("value", "Ada");
  });

  it("asks before closing a dirty form, and does not close while the answer is pending", async () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} onSubmit={vi.fn().mockResolvedValue(null)} />);

    typeName("Ada");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByText("Discard unsaved changes?")).toBeTruthy();
    expect(onOpenChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText("Discard"));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it("closes without asking when nothing was edited", async () => {
    const onOpenChange = vi.fn();
    render(<Harness onOpenChange={onOpenChange} onSubmit={vi.fn().mockResolvedValue(null)} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(screen.queryByText("Discard unsaved changes?")).toBeNull();
  });
});
