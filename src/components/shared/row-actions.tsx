"use client";

import type { ComponentType } from "react";
import { MoreHorizontal } from "lucide-react";
import { type ConfirmOptions, useConfirm } from "@/components/shared/confirm-provider";
import type { Column } from "@/components/shared/data-table";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Permission } from "@/constants/app";

export interface RowAction<T> {
  label: string;
  onSelect: (row: T) => void;
  icon?: ComponentType<{ className?: string }>;
  permission?: Permission;
  hidden?: (row: T) => boolean;
  /** Asked before `onSelect` runs. A consequential action is never one click. */
  confirm?: (row: T) => ConfirmOptions;
  destructive?: boolean;
  separatorBefore?: boolean;
  groupLabel?: string;
}

function ActionMenu<T>({ actions, row }: { actions: RowAction<T>[]; row: T }) {
  const visible = actions.filter((action) => !action.hidden?.(row));
  if (visible.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Actions">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {visible.map((action, index) => (
          <ActionItem key={action.label} action={action} row={row} isFirst={index === 0} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function rowActionsColumn<T>(actions: RowAction<T>[], key = "actions"): Column<T> {
  return {
    key,
    header: <span className="sr-only">Actions</span>,
    className: "w-12 text-right",
    // The menu is interactive; opening it is never also a row click.
    stopRowClick: true,
    cell: (row) => <ActionMenu actions={actions} row={row} />,
  };
}

function ActionItem<T>({
  action,
  row,
  isFirst,
}: {
  action: RowAction<T>;
  row: T;
  isFirst: boolean;
}) {
  const Icon = action.icon;
  const confirm = useConfirm();

  const select = async () => {
    if (action.confirm && !(await confirm(action.confirm(row)))) return;
    action.onSelect(row);
  };

  const dividing = (action.separatorBefore ?? Boolean(action.groupLabel)) && !isFirst;

  const item = (
    <>
      {dividing ? <DropdownMenuSeparator /> : null}
      {action.groupLabel ? <DropdownMenuLabel>{action.groupLabel}</DropdownMenuLabel> : null}
      <DropdownMenuItem
        variant={action.destructive ? "destructive" : "default"}
        onSelect={() => void select()}
      >
        {Icon ? <Icon /> : null}
        {action.label}
      </DropdownMenuItem>
    </>
  );

  return action.permission ? (
    <PermissionGate permission={action.permission}>{item}</PermissionGate>
  ) : (
    item
  );
}
