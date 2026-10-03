/* eslint-disable no-console -- the one file allowed to; everything else logs through it. */

type Level = "debug" | "info" | "warn" | "error";

const SERVICE = process.env.NEXT_PUBLIC_SERVICE_NAME;
const VERSION = process.env.NEXT_PUBLIC_SERVICE_VERSION;

const SEVERITY: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

const isServer = typeof window === "undefined";

/** Nobody reads a production browser console, so the browser writes nothing there —
 *  real client telemetry is an SDK (Sentry, RUM), wired in `emit`. See the README. */
const BROWSER_SILENT = Number.POSITIVE_INFINITY;

const MINIMUM =
  process.env.NODE_ENV === "production"
    ? isServer
      ? SEVERITY.info
      : BROWSER_SILENT
    : SEVERITY.debug;

function emit(level: Level, message: string, fields: Record<string, unknown> = {}): void {
  if (SEVERITY[level] < MINIMUM) return;

  const entry = {
    level,
    time: new Date().toISOString(),
    service: SERVICE,
    version: VERSION,
    env: process.env.NODE_ENV,
    message,
    ...fields,
  };

  // One JSON line wherever it runs, exactly like the API — so a browser line and the
  // server lines behind it read the same, and one collector rule parses both.
  const line = JSON.stringify(entry);

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, fields?: Record<string, unknown>) => emit("debug", message, fields),
  info: (message: string, fields?: Record<string, unknown>) => emit("info", message, fields),
  warn: (message: string, fields?: Record<string, unknown>) => emit("warn", message, fields),
  error: (message: string, fields?: Record<string, unknown>) => emit("error", message, fields),
};
