"use client";

import { logger } from "@/utils/logger";

/** Last resort: the root layout itself failed, so this renders its own <html>. */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  logger.error("application crashed", {
    digest: error.digest,
    error: error.message,
    stack: error.stack,
  });

  return (
    <html lang="en">
      <body style={{ display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ fontSize: "1.25rem" }}>Application error</h1>
          <p>Reload the page. If it keeps happening, contact support.</p>
        </div>
      </body>
    </html>
  );
}
