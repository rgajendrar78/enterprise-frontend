import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY } from "@/constants/config";
import { extractErrorMessage, getErrorStatus, isCanceled } from "@/utils/error";
import { routeByStatus } from "@/utils/route-by-status";

// Every failed query and mutation lands here; features never toast errors themselves.
function reportError(error: unknown): void {
  // Navigating away mid-request must not raise "Something went wrong".
  if (isCanceled(error) || routeByStatus(error)) return;
  toast.error(extractErrorMessage(error));
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY.STALE_TIME_MS,
        gcTime: QUERY.GC_TIME_MS,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = getErrorStatus(error);
          if (status && status < 500) return false;
          return failureCount < QUERY.MAX_RETRIES;
        },
      },
      mutations: { retry: false },
    },
    queryCache: new QueryCache({ onError: reportError }),
    mutationCache: new MutationCache({ onError: reportError }),
  });
}
