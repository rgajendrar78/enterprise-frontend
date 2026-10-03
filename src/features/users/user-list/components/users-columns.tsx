import type { Column } from "@/components/shared/data-table";
import { type RowAction, rowActionsColumn } from "@/components/shared/row-actions";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, STATUS } from "@/constants/app";
import type { User } from "@/types/user";
import { formatDate } from "@/utils/format";

const isDeleted = (user: User) => user.deletedAt !== null;

/** Columns live outside the screen component so neither file grows unbounded. The
 *  actions are passed in: they belong to the feature, not to this table. */
export function buildUserColumns(actions: RowAction<User>[]): Column<User>[] {
  return [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border">
            <AvatarImage
              src={user.profile?.imageUrl ?? undefined}
              alt={user.profile?.name ?? "User"}
              className="object-cover"
            />
            <AvatarFallback className="bg-field text-xs">
              {(user.profile?.name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.profile?.name || "Unknown"}</p>
            <p className="text-muted-foreground text-xs">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      cell: (user) => <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>,
    },
    {
      key: "isActive",
      header: "Status",
      sortable: true,
      cell: (user) =>
        isDeleted(user) ? (
          <Badge variant="outline">Deleted</Badge>
        ) : (
          <StatusBadge status={user.isActive ? STATUS.ACTIVE : STATUS.INACTIVE} />
        ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      cell: (user) => formatDate(user.createdAt),
    },
    rowActionsColumn(actions),
  ];
}
