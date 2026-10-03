import type { ReactNode } from "react";

/** Label above value — the detail-page equivalent of a table cell. */
export function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
      <div className="text-sm">{value}</div>
    </div>
  );
}
