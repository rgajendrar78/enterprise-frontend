import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";

// Raw palette utilities bypass the tokens in globals.css, so they cannot follow
// light and dark. Assembled from parts: Tailwind scans this file and would emit them.
const COLOUR_PROPS = [
  "bg",
  "text",
  "border",
  "ring",
  "fill",
  "stroke",
  "from",
  "via",
  "to",
  "shadow",
  "outline",
  "decoration",
  "divide",
  "accent",
  "caret",
  "placeholder",
];
const PALETTE = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "white",
  "black",
];
const RAW_COLOUR = `(${COLOUR_PROPS.join("|")})-(${PALETTE.join("|")})([-/][0-9]{1,3})?|#[0-9a-fA-F]{3}|(rgba?|hsla?|oklch|oklab)\\(`;
const RAW_COLOUR_MESSAGE =
  "No hardcoded colours. Use a semantic token from src/app/globals.css (bg-card, text-muted-foreground, bg-destructive, bg-overlay …) so it follows light and dark.";

// A `dark:` colour at a call site is a second palette. It repaints one component in
// one theme and leaves every other surface behind — which is how a search box, the
// select next to it and the menu it opens ended up three different greys. The tokens
// already carry both themes, so the variant has nothing left to say. `dark:hidden`
// and friends are untouched: this only matches a colour property after the prefix.
const DARK_COLOUR = `dark:[^\\s]*\\b(${COLOUR_PROPS.join("|")})-`;
const DARK_COLOUR_MESSAGE =
  "No `dark:` colour overrides. Both themes live in src/app/globals.css — if the token is wrong in one of them, fix it there and every screen follows.";

// --input is the border of a control, never its fill. Using it as a background is
// what produced a translucent trigger beside an opaque input; --field is the fill.
const INPUT_AS_FILL = "\\bbg-input\\b";
const INPUT_AS_FILL_MESSAGE =
  "`--input` is a border colour. A control's fill is `bg-field` — the same one <Input> and every trigger use.";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=/${RAW_COLOUR}/]`, message: RAW_COLOUR_MESSAGE },
        { selector: `TemplateElement[value.raw=/${RAW_COLOUR}/]`, message: RAW_COLOUR_MESSAGE },
        { selector: `Literal[value=/${DARK_COLOUR}/]`, message: DARK_COLOUR_MESSAGE },
        { selector: `TemplateElement[value.raw=/${DARK_COLOUR}/]`, message: DARK_COLOUR_MESSAGE },
        { selector: `Literal[value=/${INPUT_AS_FILL}/]`, message: INPUT_AS_FILL_MESSAGE },
        {
          selector: `TemplateElement[value.raw=/${INPUT_AS_FILL}/]`,
          message: INPUT_AS_FILL_MESSAGE,
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "no-console": ["error", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "smart"],

      // Architectural rules the folder layout depends on — not style preferences.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "axios",
              importNames: ["default"],
              message:
                "Use `import { http } from '@/api/client'` — the shared instance carries the base URL, the auth header and the error mapping.",
            },
          ],
          patterns: [
            {
              group: ["../../*"],
              message: "Use the `@/` alias instead of climbing more than one level.",
            },
          ],
        },
      ],
    },
  },
  {
    // Generated library surface. The hardcoded-colour and bg-input rules still apply —
    // they are what you re-run lint for after `shadcn add`. The `dark:` rule does not:
    // shadcn tunes the *alpha* of --destructive per theme on its own controls, and
    // rewriting that on every regeneration would buy nothing. Your own code, and every
    // screen under app/ features/ components/layout/ components/shared/, is covered.
    files: ["src/components/ui/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=/${RAW_COLOUR}/]`, message: RAW_COLOUR_MESSAGE },
        { selector: `TemplateElement[value.raw=/${RAW_COLOUR}/]`, message: RAW_COLOUR_MESSAGE },
        { selector: `Literal[value=/${INPUT_AS_FILL}/]`, message: INPUT_AS_FILL_MESSAGE },
        {
          selector: `TemplateElement[value.raw=/${INPUT_AS_FILL}/]`,
          message: INPUT_AS_FILL_MESSAGE,
        },
      ],
    },
  },
  {
    // The file that constructs the axios instance, and its own test — which has to
    // stub the bare `axios.post` the refresh path deliberately makes.
    files: ["src/api/client.ts", "src/api/client.spec.ts"],
    rules: { "no-restricted-imports": "off" },
  },
  {
    // Runs outside the React tree (TanStack cache), where useRouter() does not exist.
    files: ["src/utils/route-by-status.ts"],
    rules: { "@next/next/no-location-assign-relative-destination": "off" },
  },
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    ".github/**",
    "next-env.d.ts",
    "commitlint.config.mjs",
  ]),
]);
