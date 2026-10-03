"use client";

import { useEffect } from "react";
import { logger } from "@/utils/logger";

/** Error boundaries only see render-time throws; this catches the rest — stray
 *  rejections, handler and timer throws. Reports only: they happen off-screen. */
export function ErrorTrap() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      logger.error("uncaught error", {
        error: event.message,
        source: `${event.filename}:${event.lineno}:${event.colno}`,
        stack: event.error instanceof Error ? event.error.stack : undefined,
        path: window.location.pathname,
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason: unknown = event.reason;
      logger.error("unhandled promise rejection", {
        error: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        path: window.location.pathname,
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
