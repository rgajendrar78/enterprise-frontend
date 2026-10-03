"use client";

import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDraftPopover } from "@/hooks/use-draft-popover";
import { cn } from "@/utils/cn";
import { formatDate, fromDateInput, toDateInput } from "@/utils/format";

interface DatePickerProps {
  /** `yyyy-mm-dd`, the shape the API filters on. Empty string means no date. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
  disabled?: boolean;
}

/** The date field for the whole app: `yyyy-mm-dd` on the wire, a formatted date on
 *  screen. Picking is a draft until **Done**, the same as `<DateRangePicker>`. */
export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
  ...props
}: DatePickerProps) {
  const { open, draft, setDraft, onOpenChange, commit, cancel } = useDraftPopover(value, onChange);

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
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value ? formatDate(value) : placeholder}
          </span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          autoFocus
          selected={fromDateInput(draft)}
          defaultMonth={fromDateInput(draft)}
          onSelect={(day) => setDraft(day ? toDateInput(day) : "")}
        />

        <div className="flex items-center justify-between gap-2 border-t p-2">
          <Button variant="outline" size="sm" onClick={() => commit("")}>
            Clear
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cancel}>
              Cancel
            </Button>
            <Button size="sm" disabled={!draft} onClick={() => commit(draft)}>
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
