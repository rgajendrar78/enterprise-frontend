// Imported for the side effect: `src/config/env` throws on an invalid value, so
// a misconfigured environment fails `next build` instead of the browser.
import type { NextConfig } from "next";
import { readFileSync } from "node:fs";
import "./src/config/env";

/** Identity from `package.json`. A browser cannot read a file, so these are inlined at
 *  build time and land on every client log line — nothing to set at deploy time. */
const { name, version } = JSON.parse(readFileSync("./package.json", "utf8")) as {
  name: string;
  version: string;
};

const nextConfig: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_SERVICE_NAME: name,
    NEXT_PUBLIC_SERVICE_VERSION: version,
  },
  // Standalone output keeps the Docker image to the server + traced deps.
  output: "standalone",

  // Stated so nobody "temporarily" flips it. (Linting is a `pnpm verify` step —
  // Next 16 no longer runs eslint during `next build`.)
  typescript: { ignoreBuildErrors: false },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
