"use client";

import { Search, X } from "lucide-react";
import { DatePicker } from "@/components/shared/date-picker";
import { DateRangePicker } from "@/components/shared/date-range-picker";
import { SearchableSelect } from "@/components/shared/searchable-select";
import type { SelectOption } from "@/components/shared/searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UI } from "@/constants/config";
import type { Pagination } from "@/hooks/use-pagination";

/** An empty value cannot be a real option, so "no filter" needs a sentinel. */
const ANY = "__any__";

export type FilterConfig =
  | { type: "search"; placeholder?: string }
  | {
      type: "select";
      key: string;
      label: string;
      /** What the control reads when nothing is filtered — spell it out ("All roles",
       *  "Hide deleted"). Derived from `label` it becomes "All role", and for a flag it
       *  states the opposite of what it does. */
      allLabel: string;
      options: SelectOption[];
    }
  | { type: "date"; key: string; label: string }
  | { type: "daterange"; fromKey: string; toKey: string; label: string };

interface Props {
  pagination: Pagination;
  filters: FilterConfig[];
}

export function GlobalFilter({ pagination, filters }: Props) {
  const { params, setSearch, setFilter, reset } = pagination;
  const isFiltered = Object.entries(params).some(
    ([key, value]) => !["page", "limit", "sort"].includes(key) && value !== undefined,
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        if (filter.type === "search") {
          return (
            <div key="search" className="relative w-full sm:w-64">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
              <Input
                className="pl-8"
                aria-label="Search"
                placeholder={filter.placeholder ?? "Search…"}
                value={params.search ?? ""}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          );
        }

        if (filter.type === "daterange") {
          return (
            <DateRangePicker
              key={filter.fromKey}
              className="w-64"
              aria-label={filter.label}
              placeholder={filter.label}
              value={{
                from: String(params[filter.fromKey] ?? ""),
                to: String(params[filter.toKey] ?? ""),
              }}
              onChange={({ from, to }) => {
                setFilter(filter.fromKey, from || undefined);
                setFilter(filter.toKey, to || undefined);
              }}
            />
          );
        }

        if (filter.type === "date") {
          return (
            <DatePicker
              key={filter.key}
              className="w-44"
              aria-label={filter.label}
              placeholder={filter.label}
              value={String(params[filter.key] ?? "")}
              onChange={(value) => setFilter(filter.key, value || undefined)}
            />
          );
        }

        return (
          <SearchableSelect
            key={filter.key}
            className="w-40"
            aria-label={filter.label}
            value={String(params[filter.key] ?? ANY)}
            onChange={(value) => setFilter(filter.key, value === ANY ? undefined : value)}
            searchable={filter.options.length >= UI.SEARCHABLE_OPTIONS}
            searchPlaceholder={`Search ${filter.label.toLowerCase()}…`}
            options={[{ value: ANY, label: filter.allLabel }, ...filter.options]}
          />
        );
      })}

      {isFiltered ? (
        <Button variant="outline" size="sm" onClick={reset}>
          <X /> Clear
        </Button>
      ) : null}
    </div>
  );
}
