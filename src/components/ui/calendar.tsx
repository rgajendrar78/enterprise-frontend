"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { buttonVariants } from "@/components/ui/button";
import { CALENDAR } from "@/constants/config";
import { cn } from "@/utils/cn";

/** react-day-picker owns the calendar logic — months, weeks, keyboard, locale. Every
 *  colour here is a token, so it follows light and dark like everything else. */
function Calendar({
  className,
  classNames,
  captionLayout = "dropdown",
  startMonth,
  endMonth,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  // Bounds the year dropdown: wide enough for a birth date, a decade ahead for anything
  // scheduled. Pass your own where the real range is narrower.
  const thisYear = new Date().getFullYear();
  const usesDropdowns = captionLayout !== "label";

  return (
    <DayPicker
      captionLayout={captionLayout}
      startMonth={startMonth ?? new Date(thisYear - CALENDAR.YEARS_BACK, 0)}
      endMonth={endMonth ?? new Date(thisYear + CALENDAR.YEARS_FORWARD, 11)}
      // `relative` anchors the nav arrows, which are positioned against this root.
      className={cn("relative p-3", className)}
      classNames={{
        months: "flex flex-col gap-4 sm:flex-row",
        month: "flex flex-col gap-4",
        month_caption: "flex h-9 items-center justify-center px-9",
        // The dropdowns already name the month, so the label would say it twice —
        // but it stays in the accessibility tree as the caption for the grid.
        caption_label: usesDropdowns ? "sr-only" : "text-sm font-medium",
        dropdowns: "flex items-center gap-1.5",
        dropdown_root: "relative",
        // Pinned across the caption row, so it lies on top of the month and year
        // selects — `pointer-events-none` lets their clicks through to them.
        nav: "pointer-events-none absolute inset-x-3 top-3 flex h-9 items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "pointer-events-auto opacity-60 hover:opacity-100",
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "pointer-events-auto opacity-60 hover:opacity-100",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground w-9 text-[0.8rem] font-normal",
        week: "mt-1 flex w-full",
        day: "size-9 p-0",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal aria-selected:opacity-100",
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        range_middle: "bg-accent [&>button]:bg-transparent [&>button]:text-accent-foreground",
        today: "[&>button]:border [&>button]:border-input",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        // The app's own picker, so a hundred years is a search rather than a scroll.
        // Options carry numbers; a `<select>` change event is what react-day-picker reads.
        Dropdown: ({ options = [], value, onChange, "aria-label": label }) => (
          <SearchableSelect
            aria-label={label}
            className="h-8 w-auto gap-1 px-2"
            value={String(value ?? "")}
            options={options
              .filter((option) => !option.disabled)
              .map((option) => ({ value: String(option.value), label: option.label }))}
            onChange={(next) =>
              onChange?.({ target: { value: next } } as React.ChangeEvent<HTMLSelectElement>)
            }
          />
        ),
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
