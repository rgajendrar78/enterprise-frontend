"use client";

import { type ReactNode, useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createQueryClient } from "@/api/query-client";
import { ConfirmProvider } from "@/components/shared/confirm-provider";
import { ErrorTrap } from "@/components/shared/error-trap";
import { NavigationGuard } from "@/components/shared/navigation-guard";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "@/stores/auth.store";

export function Providers({ children }: { children: ReactNode }) {
  // One client per browser session, never shared between server requests.
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    void useAuthStore.persist.rehydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorTrap />
      {/* Confirm wraps the guard: the guard asks it before letting a link through. */}
      <ConfirmProvider>
        <NavigationGuard />
        {children}
      </ConfirmProvider>
      <Toaster />
      {process.env.NODE_ENV === "development" ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
