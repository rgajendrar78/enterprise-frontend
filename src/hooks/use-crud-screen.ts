"use client";

import { useState } from "react";
import { UI } from "@/constants/config";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { type Pagination, usePagination } from "@/hooks/use-pagination";
import type { ListParams } from "@/types/api";

export interface CrudScreen<T> {
  pagination: Pagination;
  params: ListParams;
  editing: T | undefined;
  isFormOpen: boolean;
  openCreate: () => void;
  openEdit: (row: T) => void;
  setFormOpen: (open: boolean) => void;
  /** Remounts the form when the row changes, so it never shows stale values. */
  formKey: string;
}

export function useCrudScreen<T extends { id: string }>(
  initial: Partial<ListParams> = {},
): CrudScreen<T> {
  const pagination = usePagination(initial);
  // Debouncing the whole params object avoids an effect syncing two states.
  const params = useDebouncedValue(pagination.params, UI.SEARCH_DEBOUNCE_MS);

  const [editing, setEditing] = useState<T | undefined>();
  const [isFormOpen, setFormOpen] = useState(false);

  const open = (row?: T) => {
    setEditing(row);
    setFormOpen(true);
  };

  return {
    pagination,
    params,
    editing,
    isFormOpen,
    openCreate: () => open(),
    openEdit: open,
    setFormOpen,
    formKey: editing?.id ?? "new",
  };
}
