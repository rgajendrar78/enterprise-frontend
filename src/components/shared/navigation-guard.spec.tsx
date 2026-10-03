import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "@/components/shared/confirm-provider";
import { NavigationGuard } from "@/components/shared/navigation-guard";
import { useUnsavedChangesStore } from "@/stores/unsaved-changes.store";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function renderWithLink(href = "/somewhere-else") {
  return render(
    <ConfirmProvider>
      <NavigationGuard />
      <a href={href}>Go</a>
    </ConfirmProvider>,
  );
}

/** Clicking a link with a dirty form open must not throw the edits away. */
describe("NavigationGuard", () => {
  beforeEach(() => {
    push.mockClear();
    useUnsavedChangesStore.setState({ dirtyCount: 0 });
  });

  it("lets a link through when nothing is unsaved", () => {
    renderWithLink();
    const clickWasAllowed = fireEvent.click(screen.getByText("Go"));

    expect(clickWasAllowed).toBe(true);
    expect(screen.queryByText("Discard unsaved changes?")).toBeNull();
  });

  it("blocks the navigation and asks when a form is dirty", async () => {
    useUnsavedChangesStore.setState({ dirtyCount: 1 });
    renderWithLink();

    fireEvent.click(screen.getByText("Go"));

    expect(await screen.findByText("Discard unsaved changes?")).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it("navigates once the discard is confirmed", async () => {
    useUnsavedChangesStore.setState({ dirtyCount: 1 });
    renderWithLink();

    fireEvent.click(screen.getByText("Go"));
    fireEvent.click(await screen.findByText("Discard"));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/somewhere-else"));
  });

  it("stays put when the edit is kept", async () => {
    useUnsavedChangesStore.setState({ dirtyCount: 1 });
    renderWithLink();

    fireEvent.click(screen.getByText("Go"));
    fireEvent.click(await screen.findByText("Keep editing"));

    await waitFor(() => expect(screen.queryByText("Discard unsaved changes?")).toBeNull());
    expect(push).not.toHaveBeenCalled();
  });

  it("ignores links that leave the app, so downloads and new tabs still work", () => {
    useUnsavedChangesStore.setState({ dirtyCount: 1 });
    renderWithLink("https://example.com/docs");

    fireEvent.click(screen.getByText("Go"));

    expect(screen.queryByText("Discard unsaved changes?")).toBeNull();
  });
});
