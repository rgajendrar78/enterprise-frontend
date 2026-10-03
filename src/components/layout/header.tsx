"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, LogOut, PanelLeft } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { useConfirm } from "@/components/shared/confirm-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/config/env";
import { SIGN_OUT_PROMPT } from "@/constants/config";
import { DEFAULT_AUTHENTICATED_ROUTE, ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/auth.store";
import { initialsOf } from "@/utils/format";

export function Header({
  isCollapsed,
  onToggleSidebar,
}: {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  // One misclick on a toolbar icon should not end the session silently.
  const signOut = async () => {
    if (!(await confirm(SIGN_OUT_PROMPT))) return;
    useAuthStore.getState().signOut();
    router.replace(ROUTES.signIn);
  };

  return (
    <header className="bg-card flex h-14 items-center gap-3 border-b px-4 md:px-6">
      <div className="-ml-2 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleSidebar}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
          className="hidden md:inline-flex"
        >
          <PanelLeft />
        </Button>

        <div className="bg-border mx-1 hidden h-5 w-px md:block" aria-hidden />

        <Button variant="ghost" size="icon-sm" asChild aria-label="Dashboard">
          <Link href={DEFAULT_AUTHENTICATED_ROUTE}>
            <Home />
          </Link>
        </Button>
      </div>

      <span className="font-semibold md:hidden">{env.NEXT_PUBLIC_APP_NAME}</span>

      <Breadcrumbs className="hidden min-w-0 flex-1 truncate sm:block" />

      <div className="ml-auto flex items-center gap-3">
        {hydrated ? (
          <>
            <Link href={ROUTES.account} className="flex items-center gap-3" aria-label="Account">
              <div className="hidden text-right sm:block">
                <p className="text-sm leading-tight font-medium">{user?.profile?.name}</p>
                <p className="text-muted-foreground text-xs leading-tight">{user?.email}</p>
              </div>
              <Avatar className="size-8">
                <AvatarImage
                  src={user?.profile?.imageUrl ?? undefined}
                  alt={user?.profile?.name || "User"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                  {user ? initialsOf(user.profile?.name || "User") : "?"}
                </AvatarFallback>
              </Avatar>
            </Link>
          </>
        ) : (
          <Skeleton className="size-8 rounded-full" />
        )}
        <ThemeToggle />

        {/* `ghost`, like the toggle beside it — a hand-rolled button here drifted from
            it on hover, focus and hit area the moment either one changed. */}
        <Button variant="ghost" size="icon-sm" onClick={() => void signOut()} aria-label="Sign out">
          <LogOut />
        </Button>
      </div>
    </header>
  );
}
