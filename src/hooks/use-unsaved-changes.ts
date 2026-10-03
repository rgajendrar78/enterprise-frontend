"use client";

import { useEffect } from "react";
import { useUnsavedChangesStore } from "@/stores/unsaved-changes.store";

/** Declares this form is holding edits — pass `form.formState.isDirty`. Tab close then
 *  warns and `<NavigationGuard>` intercepts links; unregisters on unmount. */
export function useUnsavedChanges(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;

    const { markDirty, markClean } = useUnsavedChangesStore.getState();
    markDirty();

    // The browser shows its own wording here; the text is not ours to choose.
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);

    return () => {
      markClean();
      window.removeEventListener("beforeunload", warn);
    };
  }, [isDirty]);
}
