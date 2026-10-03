"use client";

import { ShieldCheck, UserCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { ROLE_LABELS } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { usersApi } from "@/features/users/services/use-users";
import { usePermission } from "@/hooks/use-permission";
import { formatNumber } from "@/utils/format";

/** Replace these tiles with your own metrics endpoint — the shape is the point. */
export function DashboardPage() {
  const { user } = usePermission();
  const all = usersApi.useList({ page: 1, limit: 1 });
  const active = usersApi.useList({ page: 1, limit: 1, isActive: true });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.profile?.name ?? "there"}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total users"
          value={formatNumber(all.data?.meta.totalCount)}
          icon={Users}
          isLoading={all.isPending}
          href={ROUTES.users}
        />
        <StatCard
          label="Active users"
          value={formatNumber(active.data?.meta.totalCount)}
          icon={UserCheck}
          isLoading={active.isPending}
          href={`${ROUTES.users}?isActive=true`}
        />
        <StatCard
          label="Your role"
          value={user ? ROLE_LABELS[user.role] : "—"}
          hint={`${user?.permissions.length ?? 0} permissions`}
          icon={ShieldCheck}
          href={ROUTES.account}
        />
      </div>
    </>
  );
}
