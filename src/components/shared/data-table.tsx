"use client";

import type { KeyboardEvent, ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ChevronsUpDown, WifiOff } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PaginationBar } from "@/components/shared/table-pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UI } from "@/constants/config";
import { CLIENT_MESSAGE } from "@/constants/errors";
import type { Pagination, SortDirection } from "@/hooks/use-pagination";
import type { ListResult, PaginationMeta } from "@/types/api";
import { cn } from "@/utils/cn";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  stopRowClick?: boolean;
}

type ListQuery<T> = Pick<
  UseQueryResult<ListResult<T>>,
  "data" | "isPending" | "isFetching" | "isError" | "refetch"
>;

interface BaseProps<T> {
  columns: Column<T>[];
  emptyTitle?: string;
  emptyDescription?: string;
  pagination?: Pagination;
  onRowClick?: (row: T) => void;
}

/** `query` covers every list screen: rows, count, loading, refreshing and failure come
 *  off one object, so no screen can wire four of the five and forget the last. `rows` is
 *  for a table over data that is not a query — it has no states to get wrong. */
type DataTableProps<T> = BaseProps<T> &
  (
    | { query: ListQuery<T>; rows?: never; meta?: never; isLoading?: never }
    | { query?: never; rows: T[] | undefined; meta?: PaginationMeta; isLoading?: boolean }
  );

export function DataTable<T extends { id: string }>({
  columns,
  query,
  rows,
  meta,
  isLoading = false,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  pagination,
  onRowClick,
}: DataTableProps<T>) {
  const items = query ? query.data?.items : rows;
  const total = query ? query.data?.meta : meta;
  const isFirstLoad = query ? query.isPending : isLoading;
  const isRefreshing = query ? query.isFetching && !query.isPending : false;

  const hasRows = (items?.length ?? 0) > 0;
  // A failed load must not read as "no results". Stale rows still beat an error panel:
  // the toast already said it, and what is on screen is still usable.
  const showError = Boolean(query?.isError) && !hasRows && !isFirstLoad;
  const showEmpty = !isFirstLoad && !showError && !hasRows;

  return (
    <div
      aria-busy={isRefreshing}
      className={cn(
        "bg-card text-card-foreground rounded-xl border shadow-sm",
        isRefreshing && "opacity-60 transition-opacity",
      )}
    >
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => {
              const sortable = column.sortable && pagination;
              const direction = sortable ? pagination.sortDirection(column.key) : undefined;

              return (
                <TableHead
                  key={column.key}
                  className={column.className}
                  aria-sort={sortable ? SORT_ANNOUNCEMENT[direction ?? "none"] : undefined}
                >
                  {sortable ? (
                    <SortButton
                      label={column.header}
                      direction={direction}
                      onClick={() => pagination.toggleSort(column.key)}
                    />
                  ) : (
                    column.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isFirstLoad
            ? Array.from({ length: UI.TABLE_SKELETON_ROWS }, (_, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : items?.map((row) => (
                <TableRow
                  key={row.id}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={
                    onRowClick
                      ? "hover:bg-muted/50 focus-visible:ring-ring cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-inset"
                      : undefined
                  }
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick ? (event) => activateOnKey(event, () => onRowClick(row)) : undefined
                  }
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={column.className}
                      onClick={column.stopRowClick ? (event) => event.stopPropagation() : undefined}
                    >
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
        </TableBody>
      </Table>

      {showError ? (
        <EmptyState
          icon={WifiOff}
          title={CLIENT_MESSAGE.LIST_FAILED}
          description={CLIENT_MESSAGE.LIST_FAILED_HINT}
          action={
            <Button variant="outline" onClick={() => void query?.refetch()}>
              Try again
            </Button>
          }
        />
      ) : null}

      {showEmpty ? <EmptyState title={emptyTitle} description={emptyDescription} /> : null}

      {total && pagination ? (
        <PaginationBar
          meta={total}
          onPageChange={pagination.setPage}
          onLimitChange={pagination.setLimit}
        />
      ) : null}
    </div>
  );
}

function activateOnKey(event: KeyboardEvent, activate: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  activate();
}

const SORT_ANNOUNCEMENT = {
  asc: "ascending",
  desc: "descending",
  none: "none",
} as const;

function SortButton({
  label,
  direction,
  onClick,
}: {
  label: ReactNode;
  direction: SortDirection | undefined;
  onClick: () => void;
}) {
  const Icon = !direction ? ChevronsUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:text-foreground -ml-1 flex items-center gap-1 rounded px-1 py-0.5"
    >
      {label}
      <Icon className="size-3.5" />
    </button>
  );
}
