import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { STATUS, type Status } from "@/constants/app";

/** One place for status colours — never a `switch` inside a component. */
const STATUS_VARIANT: Record<Status, BadgeVariant> = {
  [STATUS.ACTIVE]: "success",
  [STATUS.INACTIVE]: "secondary",
  [STATUS.PENDING]: "warning",
  [STATUS.FAILED]: "destructive",
};

export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"}>
      {label ?? status.replace(/_/g, " ")}
    </Badge>
  );
}
