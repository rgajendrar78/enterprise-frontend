import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDraftPopover } from "@/hooks/use-draft-popover";

describe("useDraftPopover", () => {
  // The whole point: a half-made choice must not reach the caller, or a range with no
  // end yet fires a query nobody asked for.
  it("does not apply anything until commit", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDraftPopover<string>("start", onChange));

    act(() => result.current.setDraft("edited"));

    expect(result.current.draft).toBe("edited");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("applies and closes on commit", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDraftPopover<string>("start", onChange));

    act(() => result.current.onOpenChange(true));
    act(() => result.current.commit("chosen"));

    expect(onChange).toHaveBeenCalledWith("chosen");
    expect(result.current.open).toBe(false);
  });

  it("closes without applying on cancel", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useDraftPopover<string>("start", onChange));

    act(() => result.current.onOpenChange(true));
    act(() => result.current.setDraft("edited"));
    act(() => result.current.cancel());

    expect(onChange).not.toHaveBeenCalled();
    expect(result.current.open).toBe(false);
  });

  // Without this the next open still shows the abandoned edit.
  it("restarts from the applied value each time it opens", () => {
    const { result } = renderHook(() => useDraftPopover<string>("start", vi.fn()));

    act(() => result.current.onOpenChange(true));
    act(() => result.current.setDraft("abandoned"));
    act(() => result.current.cancel());
    act(() => result.current.onOpenChange(true));

    expect(result.current.draft).toBe("start");
  });
});
