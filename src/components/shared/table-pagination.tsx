"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE_OPTIONS } from "@/constants/app";
import type { PaginationMeta } from "@/types/api";

/** The pager under every `<DataTable>`. First and last jump straight to the ends: on page 40 of 41, stepping is the long way
 *  round. Add a step by adding a row. */
export const PAGE_STEPS = [
  { label: "First page", icon: ChevronsLeft, target: () => 1, atEdge: onFirstPage },
  {
    label: "Previous page",
    icon: ChevronLeft,
    target: (meta: PaginationMeta) => meta.page - 1,
    atEdge: onFirstPage,
  },
  {
    label: "Next page",
    icon: ChevronRight,
    target: (meta: PaginationMeta) => meta.page + 1,
    atEdge: onLastPage,
  },
  {
    label: "Last page",
    icon: ChevronsRight,
    target: (meta: PaginationMeta) => meta.totalPages,
    atEdge: onLastPage,
  },
] as const;

function onFirstPage(meta: PaginationMeta): boolean {
  return meta.page <= 1;
}

function onLastPage(meta: PaginationMeta): boolean {
  return meta.page >= meta.totalPages;
}

export function PaginationBar({
  meta,
  onPageChange,
  onLimitChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}) {
  const first = meta.totalCount === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const last = Math.min(meta.page * meta.limit, meta.totalCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        {first}–{last} of {meta.totalCount}
      </p>

      <div className="flex items-center gap-2">
        {onLimitChange ? (
          <SearchableSelect
            className="h-8 w-20"
            aria-label="Rows per page"
            value={String(meta.limit)}
            onChange={(value) => onLimitChange(Number(value))}
            options={PAGE_SIZE_OPTIONS.map((size) => ({
              value: String(size),
              label: String(size),
            }))}
          />
        ) : null}

        {/* Icon-only, so the bar stays the same width in every language. Each carries
            its own `aria-label`, which is the accessible name a word would have given. */}
        {PAGE_STEPS.map(({ label, icon: Icon, target, atEdge }) => (
          <Button
            key={label}
            variant="outline"
            size="icon-sm"
            aria-label={label}
            disabled={atEdge(meta)}
            onClick={() => onPageChange(target(meta))}
          >
            <Icon />
          </Button>
        ))}
      </div>
    </div>
  );
}
