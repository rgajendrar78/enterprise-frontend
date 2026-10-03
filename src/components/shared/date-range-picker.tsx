"use client";

import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDraftPopover } from "@/hooks/use-draft-popover";
import { cn } from "@/utils/cn";
import { formatDate, fromDateInput, toDateInput } from "@/utils/format";

export interface DateRangeValue {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  disabled?: boolean;
}

const EMPTY: DateRangeValue = { from: "", to: "" };

const describe = (value: DateRangeValue, placeholder: string) =>
  value.from ? `${formatDate(value.from)} – ${value.to ? formatDate(value.to) : "…"}` : placeholder;

/** One control for both ends, so they cannot be set to an impossible order. A draft
 *  until **Done**, so a half-chosen range never fires a query nobody asked for. */
export function DateRangePicker({
  value,
  onChange,
  placeholder = "Any date",
  className,
  disabled,
  ...props
}: DateRangePickerProps) {
  const { open, draft, setDraft, onOpenChange, commit, cancel } = useDraftPopover(value, onChange);

  const selected = { from: fromDateInput(draft.from), to: fromDateInput(draft.to) };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={props["aria-label"]}
          disabled={disabled}
          className={cn("justify-start gap-2 font-normal", className)}
        >
          <CalendarIcon className="shrink-0 opacity-50" />
          <span className={cn("truncate", !value.from && "text-muted-foreground")}>
            {describe(value, placeholder)}
          </span>
        </Button>
      </PopoverTrigger>

      {/* Two months side by side, but never wider than the viewport. */}
      <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] overflow-x-auto p-0">
        <Calendar
          mode="range"
          autoFocus
          numberOfMonths={2}
          selected={selected.from ? selected : undefined}
          defaultMonth={selected.from}
          onSelect={(range) =>
            setDraft({
              from: range?.from ? toDateInput(range.from) : "",
              to: range?.to ? toDateInput(range.to) : "",
            })
          }
        />

        <div className="flex items-center justify-between gap-2 border-t p-2">
          <Button variant="outline" size="sm" onClick={() => commit(EMPTY)}>
            Clear
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cancel}>
              Cancel
            </Button>
            <Button size="sm" disabled={!draft.from} onClick={() => commit(draft)}>
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
