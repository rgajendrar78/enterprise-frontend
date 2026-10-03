import { describe, expect, it } from "vitest";
import { buildCrumbs } from "@/components/shared/breadcrumbs";

describe("buildCrumbs", () => {
  it("names each segment from the label map", () => {
    expect(buildCrumbs("/users")).toEqual([{ href: "/users", label: "Users" }]);
  });

  // The id is meaningless to read, so the trail says what it identifies instead.
  it("names a dynamic segment after its parent, not the raw id", () => {
    expect(buildCrumbs("/users/0f8fad5b-d9cb-469f")).toEqual([
      { href: "/users", label: "Users" },
      { href: "/users/0f8fad5b-d9cb-469f", label: "User detail" },
    ]);
  });

  // Better a readable segment than a crash on a route nobody added a label for.
  it("falls back to the segment itself when nothing is configured", () => {
    expect(buildCrumbs("/reports")).toEqual([{ href: "/reports", label: "reports" }]);
  });

  it("has nothing to say at the root", () => {
    expect(buildCrumbs("/")).toEqual([]);
  });
});
