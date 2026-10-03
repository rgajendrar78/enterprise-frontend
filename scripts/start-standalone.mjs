import { spawn } from "node:child_process";
import { access, cp } from "node:fs/promises";

/** Runs the build as production does: standalone leaves `static/` and `public/` out,
 *  so copy them in first. **Restart after every build** or assets 500 on a blank page. */
const ROOT = new URL("..", import.meta.url);
const rel = (path) => new URL(path, ROOT);

const exists = async (path) =>
  access(path)
    .then(() => true)
    .catch(() => false);

if (!(await exists(rel(".next/standalone/server.js")))) {
  console.error("No standalone build found. Run `pnpm build` first.");
  process.exit(1);
}

await cp(rel(".next/static"), rel(".next/standalone/.next/static"), { recursive: true });
if (await exists(rel("public"))) {
  await cp(rel("public"), rel(".next/standalone/public"), { recursive: true });
}

spawn(process.execPath, ["server.js"], {
  cwd: rel(".next/standalone"),
  stdio: "inherit",
}).on("exit", (code) => process.exit(code ?? 0));
