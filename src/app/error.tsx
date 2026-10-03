"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/utils/logger";

/** Catches render/data errors inside a route segment. */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // `digest` is Next's id for the matching server-side stack — the only way to
    // tie this screen back to the server log when the error came from there.
    logger.error("route crashed", {
      digest: error.digest,
      error: error.message,
      stack: error.stack,
      path: window.location.pathname,
    });
  }, [error]);

  return (
    <div className="grid min-h-[60vh] place-items-center p-6 text-center">
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">
          The page could not be displayed. Try again, or go back and retry the action.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
