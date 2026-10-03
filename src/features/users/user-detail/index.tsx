"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, UserX } from "lucide-react";
import { useConfirm } from "@/components/shared/confirm-provider";
import { DetailField } from "@/components/shared/detail-field";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGate } from "@/components/shared/permission-gate";
import { StatusBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSION, ROLE_LABELS, STATUS } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { UserFormDialog } from "@/features/users/components/user-form-dialog";
import { canDeleteUser, deleteUserPrompt } from "@/features/users/data/user-actions";
import { usersApi } from "@/features/users/services/use-users";
import { useAuthStore } from "@/stores/auth.store";
import type { User } from "@/types/user";
import { formatDate } from "@/utils/format";

export function UserDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const currentUserId = useAuthStore((state) => state.user?.id);

  const { data: user, isPending, isError } = usersApi.useOne(id);
  const [isEditing, setEditing] = useState(false);

  const deleteUser = usersApi.useRemove();

  // The same question the row menu asks, and then back to the list: this screen would
  // otherwise sit on a row that no longer exists.
  const askDelete = async (target: User) => {
    if (await confirm(deleteUserPrompt(target))) {
      deleteUser.mutate(target.id, { onSuccess: () => router.push(ROUTES.users) });
    }
  };

  // A deleted row or a mistyped id. Without this the page holds its loading skeletons
  // for ever, because the query has settled but there is nothing to render.
  if (isError) {
    return (
      <EmptyState
        icon={UserX}
        title="User not found"
        description="It may have been deleted, or the link may be wrong."
        action={
          <Button asChild variant="outline">
            <Link href={ROUTES.users}>Back to users</Link>
          </Button>
        }
      />
    );
  }

  return (
    <>
      <PageHeader
        title={user?.profile?.name ?? "User"}
        description={user?.email}
        actions={
          user ? (
            <>
              <PermissionGate permission={PERMISSION.USERS_UPDATE}>
                <Button onClick={() => setEditing(true)}>
                  <Pencil /> Edit
                </Button>
              </PermissionGate>
              {canDeleteUser(user, currentUserId) ? (
                <PermissionGate permission={PERMISSION.USERS_DELETE}>
                  <Button variant="destructive" onClick={() => void askDelete(user)}>
                    <Trash2 className="mr-2 size-4" /> Remove
                  </Button>
                </PermissionGate>
              ) : null}
            </>
          ) : null
        }
      />

      <Card>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isPending || !user ? (
            Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-10" />)
          ) : (
            <>
              <div className="col-span-full">
                <Avatar className="h-20 w-20 border">
                  <AvatarImage
                    src={user.profile?.imageUrl ?? undefined}
                    alt={user.profile?.name ?? "User"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-field text-xl">
                    {(user.profile?.name || "U").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <DetailField label="Name" value={user.profile?.name || "Unknown"} />
              <DetailField label="Email" value={user.email} />
              <DetailField label="Role" value={ROLE_LABELS[user.role]} />
              <DetailField
                label="Status"
                value={<StatusBadge status={user.isActive ? STATUS.ACTIVE : STATUS.INACTIVE} />}
              />
              <DetailField label="Created" value={formatDate(user.createdAt)} />
              <DetailField label="Last updated" value={formatDate(user.updatedAt)} />
            </>
          )}
        </CardContent>
      </Card>

      <UserFormDialog
        key={user?.updatedAt}
        open={isEditing}
        onOpenChange={setEditing}
        user={user}
      />
    </>
  );
}
