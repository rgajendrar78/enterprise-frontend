const DATE = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const NUMBER = new Intl.NumberFormat();

export function formatDate(value: string | null | undefined): string {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? DATE.format(date) : "—";
}

/** `yyyy-mm-dd` from the calendar's local date. `toISOString()` would convert to UTC
 *  first and hand back yesterday for anyone east of Greenwich after their evening. */
export function toDateInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The reverse of `toDateInput`. Parsed at midday so no timezone can shift a bare
 *  `yyyy-mm-dd` across a date boundary when it is rendered. */
export function fromDateInput(value: string): Date | undefined {
  return value ? new Date(`${value}T12:00:00`) : undefined;
}

export function formatNumber(value: number | null | undefined): string {
  return typeof value === "number" ? NUMBER.format(value) : "—";
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
