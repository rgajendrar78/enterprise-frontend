import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // Hand-rolled instead of vite-tsconfig-paths: one alias does not need a plugin.
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.spec.{ts,tsx}"],
    coverage: { provider: "v8", reporter: ["text", "lcov"], exclude: ["**/*.spec.*"] },
  },
});
