import type { FilterConfig } from "@/components/shared/global-filter";
import { ACTIVE_OPTIONS, BOOLEAN_VALUE, ROLE_OPTIONS } from "@/constants/app";

/** Declarative: `<GlobalFilter>` renders these and `usePagination` holds the state. */
export const USER_FILTERS: FilterConfig[] = [
  { type: "search", placeholder: "Search by name or email…" },
  { type: "select", key: "role", label: "Role", allLabel: "All roles", options: ROLE_OPTIONS },
  {
    type: "select",
    key: "isActive",
    label: "Status",
    allLabel: "All statuses",
    options: ACTIVE_OPTIONS,
  },
  { type: "daterange", fromKey: "createdAtFrom", toKey: "createdAtTo", label: "Created" },
  {
    // Not a filter over deleted rows but a switch that widens the query, so both ends
    // say what they do: the API hides soft-deleted rows unless asked.
    type: "select",
    key: "includeDeleted",
    label: "Deleted rows",
    allLabel: "Hide deleted",
    options: [{ value: BOOLEAN_VALUE.TRUE, label: "Include deleted" }],
  },
];
