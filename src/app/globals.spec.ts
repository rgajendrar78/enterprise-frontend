import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CSS = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

const LIGHT = ":root";
const DARK = ':root[data-theme="dark"]';
const THEME = "@theme inline";

/** Parity is a rule about *colours*. A token with no call in it is a scalar — a
 *  radius, the brand hue, a chroma — and is deliberately shared by both themes, so
 *  a new one needs no edit here. Every colour goes through a function and is caught. */
const isScalar = (value: string): boolean => !value.includes("(");

const isAlias = (value: string): boolean => value.startsWith("var(");

const LADDER = ["--background", "--card", "--popover"];

const NEUTRALS = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--field",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--border",
  "--input",
];

const ACHROMATIC = /\(\s*[0-9.]+\s+0\s/;

function declarationsIn(selector: string): Map<string, string> {
  const start = CSS.indexOf(`${selector} {`);
  expect(start, `${selector} block is missing from globals.css`).toBeGreaterThan(-1);

  const body = CSS.slice(start + selector.length + 2, CSS.indexOf("}", start));
  const declarations = new Map<string, string>();

  for (const statement of body.split(";")) {
    const separator = statement.indexOf(":");
    if (separator === -1) continue;
    const name = statement.slice(0, separator).trim();
    if (name.startsWith("--")) declarations.set(name, statement.slice(separator + 1).trim());
  }

  return declarations;
}

function lightness(value: string): number {
  const match = /\(\s*([0-9.]+)/.exec(value);
  return Number(match?.[1] ?? Number.NaN);
}

const light = declarationsIn(LIGHT);
const dark = declarationsIn(DARK);

function expectEveryReferenceDeclared(declarations: Map<string, string>): void {
  for (const [name, value] of declarations) {
    for (const match of value.matchAll(/var\((--[\w-]+)\)/g)) {
      const target = match[1];
      expect(light.has(target ?? ""), `${name} points at undeclared ${target}`).toBe(true);
    }
  }
}

describe("colour tokens", () => {
  // The failure this catches is silent: the toggle works in one direction and the
  // screen keeps a light surface in dark mode, which nobody notices until a demo.
  it("defines every colour in both themes", () => {
    const missing = [...light].filter(
      ([name, value]) => !dark.has(name) && !isScalar(value) && !isAlias(value),
    );

    expect(
      missing.map(([name]) => name),
      "declared in :root but not in the dark block",
    ).toEqual([]);
  });

  it("has no dark-only token", () => {
    const orphans = [...dark.keys()].filter((name) => !light.has(name));
    expect(orphans, "declared in the dark block but not in :root").toEqual([]);
  });

  it("points every reference at a token that exists", () => {
    expectEveryReferenceDeclared(light);
    expectEveryReferenceDeclared(dark);
  });

  it("backs every utility in @theme with a declared token", () => {
    expectEveryReferenceDeclared(declarationsIn(THEME));
  });
});

describe("the brand", () => {
  const THEMES: [string, Map<string, string>][] = [
    ["light", light],
    ["dark", dark],
  ];

  it.each(THEMES)("builds --primary out of the knob in %s", (_theme, theme) => {
    const primary = theme.get("--primary") ?? "";

    expect(primary, "--primary no longer follows --brand-c").toContain("var(--brand-c)");
    expect(primary, "--primary no longer follows --brand-h").toContain("var(--brand-h)");
  });

  it.each(THEMES)("carries the hue into every neutral in %s", (_theme, theme) => {
    const hardcoded = NEUTRALS.filter((name) => {
      const value = theme.get(name) ?? "";
      return !value.includes("var(--brand-h)") && !ACHROMATIC.test(value);
    });

    expect(hardcoded, "hue written by hand — these stop moving with --brand-h").toEqual([]);
  });

  it("leaves the focus ring pointing at --primary", () => {
    expect(light.get("--ring")).toBe("var(--primary)");
    expect(dark.has("--ring"), "--ring is redeclared in the dark block").toBe(false);
  });
});

describe("the elevation ladder", () => {
  it.each([
    ["light", light],
    ["dark", dark],
  ])("never inverts in %s", (_theme, theme) => {
    const steps = LADDER.map((name) => ({ name, level: lightness(theme.get(name) ?? "") }));

    steps.reduce((below, step) => {
      expect(step.level, `${step.name} sits below ${below.name}`).toBeGreaterThanOrEqual(
        below.level,
      );
      return step;
    });
  });

  it.each([
    ["light", light],
    ["dark", dark],
  ])("puts a control's fill on the panel plane in %s", (_theme, theme) => {
    expect(theme.get("--field")).toBe(theme.get("--card"));
  });
});
