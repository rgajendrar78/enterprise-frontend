export async function register(): Promise<void> {
  // Guard the runtime: this file is also evaluated in the edge runtime, where
  // there is no server to describe.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { env } = await import("@/config/env");
  const { logger } = await import("@/utils/logger");

  // No `process.version` / `process.pid`: Next type-checks this file against the edge
  // runtime and warns on Node APIs. The runtime and journald report both anyway.
  logger.info("web ready", {
    appName: env.NEXT_PUBLIC_APP_NAME,
    apiUrl: env.NEXT_PUBLIC_API_URL,
  });
}
