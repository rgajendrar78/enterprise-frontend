"use client";

import { useState } from "react";

interface DraftPopover<T> {
  open: boolean;
  draft: T;
  setDraft: (next: T) => void;
  onOpenChange: (next: boolean) => void;
  commit: (next: T) => void;
  cancel: () => void;
}

/** A popover that edits a draft and applies it only on commit, so a half-made choice —
 *  a range with no end yet — never reaches the caller or fires a query. */
export function useDraftPopover<T>(value: T, onChange: (next: T) => void): DraftPopover<T> {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<T>(value);

  return {
    open,
    draft,
    setDraft,
    // Reopening restarts from what is applied, so a cancelled edit leaves no trace.
    onOpenChange: (next) => {
      if (next) setDraft(value);
      setOpen(next);
    },
    commit: (next) => {
      onChange(next);
      setOpen(false);
    },
    cancel: () => setOpen(false),
  };
}
