"use client";

import { useState } from "react";
import { DEFAULT_PAGE_SIZE } from "@/constants/app";
import type { ListParams } from "@/types/api";

export type SortDirection = "asc" | "desc";

export interface Pagination {
  params: ListParams;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSearch: (search: string) => void;
  setFilter: (key: string, value: string | undefined) => void;
  toggleSort: (key: string) => void;
  sortDirection: (key: string) => SortDirection | undefined;
  reset: () => void;
}

/** The API reads sorting as one param. Encoded here alone, so a table header, a saved
 *  view or a URL never has to know the wire format. */
const encodeSort = (key: string, direction: SortDirection) => `${key}:${direction}`;

/** Every change except `page` resets to page 1 — a filter must not leave you on an empty page 7. */
export function usePagination(initial: Partial<ListParams> = {}): Pagination {
  const initialParams: ListParams = { page: 1, limit: DEFAULT_PAGE_SIZE, ...initial };
  const [params, setParams] = useState<ListParams>(initialParams);

  const patch = (changes: Partial<ListParams>) =>
    setParams((current) => ({ ...current, ...changes, page: 1 }));

  const [sortedBy, sortedDirection] = String(params.sort ?? "").split(":");
  const sortDirection = (key: string): SortDirection | undefined =>
    sortedBy === key ? (sortedDirection === "asc" ? "asc" : "desc") : undefined;

  return {
    params,
    setPage: (page) => setParams((current) => ({ ...current, page })),
    setLimit: (limit) => patch({ limit }),
    setSearch: (search) => patch({ search: search || undefined }),
    setFilter: (key, value) => patch({ [key]: value }),
    toggleSort: (key) =>
      patch({ sort: encodeSort(key, sortDirection(key) === "asc" ? "desc" : "asc") }),
    sortDirection,
    reset: () => setParams(initialParams),
  };
}
