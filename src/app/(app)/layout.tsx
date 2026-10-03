import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";

/** Everything under this group is behind the middleware auth check. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
