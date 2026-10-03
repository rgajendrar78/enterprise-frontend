"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { GlobalFilter } from "@/components/shared/global-filter";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGate } from "@/components/shared/permission-gate";
import { Button } from "@/components/ui/button";
import { PERMISSION } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { UserFormDialog } from "@/features/users/components/user-form-dialog";
import { buildUserActions } from "@/features/users/data/user-actions";
import { useRestoreUser, usersApi } from "@/features/users/services/use-users";
import { buildUserColumns } from "@/features/users/user-list/components/users-columns";
import { USER_FILTERS } from "@/features/users/user-list/data/user-filters";
import { useCrudScreen } from "@/hooks/use-crud-screen";
import { useAuthStore } from "@/stores/auth.store";
import type { User } from "@/types/user";

export function UserListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUserId = useAuthStore((state) => state.user?.id);

  // If a dashboard card sent us here with ?isActive=true, pick it up.
  const initial = searchParams.has("isActive")
    ? { isActive: searchParams.get("isActive") === "true" }
    : {};

  const screen = useCrudScreen<User>(initial);

  const users = usersApi.useList(screen.params);
  const deleteUser = usersApi.useRemove();
  const restoreUser = useRestoreUser();

  // Same handler the row click uses, so the two ways in can never disagree.
  const openDetail = (user: User) => router.push(ROUTES.user(user.id));

  const columns = buildUserColumns(
    buildUserActions({
      currentUserId,
      onView: openDetail,
      onEdit: screen.openEdit,
      // The menu asks first — `confirm` on the Delete action.
      onDelete: (user) => deleteUser.mutate(user.id),
      onRestore: (user) => restoreUser.mutate(user.id),
    }),
  );

  return (
    <>
      <PageHeader
        title="Users"
        description="Everyone with access to this workspace."
        actions={
          <PermissionGate permission={PERMISSION.USERS_CREATE}>
            <Button onClick={screen.openCreate}>
              <Plus /> New user
            </Button>
          </PermissionGate>
        }
      />

      <GlobalFilter pagination={screen.pagination} filters={USER_FILTERS} />

      <DataTable
        columns={columns}
        query={users}
        emptyTitle="No users found"
        emptyDescription="Try a different search or filter."
        pagination={screen.pagination}
        onRowClick={openDetail}
      />

      <UserFormDialog
        key={screen.formKey}
        open={screen.isFormOpen}
        onOpenChange={screen.setFormOpen}
        user={screen.editing}
      />
    </>
  );
}
