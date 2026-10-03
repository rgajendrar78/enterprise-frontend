import { Eye, Pencil, RotateCcw, Trash2 } from "lucide-react";
import type { ConfirmOptions } from "@/components/shared/confirm-provider";
import type { RowAction } from "@/components/shared/row-actions";
import { PERMISSION } from "@/constants/app";
import type { User } from "@/types/user";

/** An action appears only when its handler is given: the detail screen leaves out View
 *  (you are already there) and Edit (it has its own button). */
interface Options {
  onView?: (user: User) => void;
  onEdit?: (user: User) => void;
  onDelete: (user: User) => void;
  onRestore: (user: User) => void;
  currentUserId: string | undefined;
}

const isDeleted = (user: User) => user.deletedAt !== null;

export const deleteUserPrompt = (user: User): ConfirmOptions => ({
  title: `Remove ${user.profile?.name || "User"}?`,
  description: "They will lose access immediately. An administrator can restore them later.",
  confirmLabel: "Remove",
});

/** The API refuses both, so nothing should offer them: you cannot delete yourself, and a
 *  deleted row is already gone. Exported so a Remove button applies the same rule. */
export const canDeleteUser = (user: User, currentUserId: string | undefined): boolean =>
  user.id !== currentUserId && !isDeleted(user);

export function buildUserActions({
  onView,
  onEdit,
  onDelete,
  onRestore,
  currentUserId,
}: Options): RowAction<User>[] {
  const view: RowAction<User>[] = onView ? [{ label: "View", icon: Eye, onSelect: onView }] : [];
  const edit: RowAction<User>[] = onEdit
    ? [
        {
          label: "Edit",
          icon: Pencil,
          permission: PERMISSION.USERS_UPDATE,
          hidden: isDeleted,
          onSelect: onEdit,
        },
      ]
    : [];

  return [
    ...view,
    ...edit,
    {
      label: "Restore",
      icon: RotateCcw,
      separatorBefore: true,
      permission: PERMISSION.USERS_DELETE,
      hidden: (user) => !isDeleted(user),
      onSelect: onRestore,
    },
    {
      label: "Remove",
      icon: Trash2,
      destructive: true,
      separatorBefore: true,
      permission: PERMISSION.USERS_DELETE,
      hidden: (user) => !canDeleteUser(user, currentUserId),
      confirm: deleteUserPrompt,
      onSelect: onDelete,
    },
  ];
}
