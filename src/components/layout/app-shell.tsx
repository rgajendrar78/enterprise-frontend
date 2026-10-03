"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { AccessDenied } from "@/components/shared/access-denied";
import { env } from "@/config/env";
import { NAV_ITEMS } from "@/constants/navigation";
import { useSession } from "@/features/auth/services/use-session";
import { usePermission } from "@/hooks/use-permission";
import { useAuthStore } from "@/stores/auth.store";
import { cn } from "@/utils/cn";

export function AppShell({ children }: { children: ReactNode }) {
  useSession();

  // In memory on purpose: reading localStorage here would need the same before-paint
  // dance as the theme, and a collapsed rail is not worth a second head script.
  const [isCollapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "bg-card shrink-0 flex-col border-r transition-[width] duration-200",
          /* Below md: always an icon-only rail. Above md: user toggles width. */
          "flex w-14 md:w-16",
          !isCollapsed && "md:w-60",
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b font-semibold",
            /* Icon-only: center the letter. Expanded: left-pad. */
            isCollapsed ? "justify-center" : "justify-center md:justify-start md:px-5",
          )}
        >
          <span className="truncate">
            {/* Small screens always see the initial; desktop follows collapse state. */}
            <span className="md:hidden">{env.NEXT_PUBLIC_APP_NAME.charAt(0)}</span>
            <span className="hidden md:inline">
              {isCollapsed ? env.NEXT_PUBLIC_APP_NAME.charAt(0) : env.NEXT_PUBLIC_APP_NAME}
            </span>
          </span>
        </div>

        <nav className="flex flex-col gap-1 p-2 md:p-3">
          <NavLinks isCollapsed={isCollapsed} />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header isCollapsed={isCollapsed} onToggleSidebar={() => setCollapsed((now) => !now)} />

        <main className="flex-1 space-y-6 p-4 md:p-6">
          <RouteGuard>{children}</RouteGuard>
        </main>
      </div>
    </div>
  );
}

function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { can } = usePermission();
  const hydrated = useAuthStore((state) => state.hydrated);

  // Permissions arrive with rehydration; deciding first would flash "no access".
  if (!hydrated) return null;

  const blocked = NAV_ITEMS.some(
    (item) =>
      (pathname === item.href || pathname.startsWith(`${item.href}/`)) &&
      item.permission &&
      !can(item.permission),
  );

  return blocked ? <AccessDenied /> : <>{children}</>;
}

function NavLinks({ isCollapsed = false }: { isCollapsed?: boolean }) {
  const pathname = usePathname();
  const { can } = usePermission();
  const hydrated = useAuthStore((state) => state.hydrated);

  if (!hydrated) return null;

  return NAV_ITEMS.filter((item) => !item.permission || can(item.permission)).map((item) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        title={item.label}
        className={cn(
          "flex items-center gap-2 rounded-md py-2 text-sm transition-colors",
          /* Small screens: always icon-only centered. Desktop: follows collapse state. */
          "justify-center px-2 md:px-2",
          !isCollapsed && "md:justify-start md:px-3",
          isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/60",
        )}
      >
        <item.icon className="size-4 shrink-0" />
        {/* Label hidden below md, shown only when desktop sidebar is expanded */}
        <span className={cn("hidden", !isCollapsed && "md:inline")}>{item.label}</span>
      </Link>
    );
  });
}
