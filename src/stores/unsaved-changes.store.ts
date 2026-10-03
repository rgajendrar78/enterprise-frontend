import { create } from "zustand";

interface UnsavedChangesState {
  /** Forms currently holding unsaved edits. A count, because two can be open. */
  dirtyCount: number;
  markDirty: () => void;
  markClean: () => void;
  hasUnsavedChanges: () => boolean;
}

/** App-wide because what reacts — the guard at the root — is nowhere near the form. */
export const useUnsavedChangesStore = create<UnsavedChangesState>((set, get) => ({
  dirtyCount: 0,
  markDirty: () => set((state) => ({ dirtyCount: state.dirtyCount + 1 })),
  markClean: () => set((state) => ({ dirtyCount: Math.max(0, state.dirtyCount - 1) })),
  hasUnsavedChanges: () => get().dirtyCount > 0,
}));
