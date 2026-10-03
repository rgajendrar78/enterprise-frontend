import { describe, expect, it } from "vitest";
import { PAGE_STEPS } from "@/components/shared/table-pagination";
import type { PaginationMeta } from "@/types/api";

const meta = (page: number, totalPages: number): PaginationMeta => ({
  page,
  limit: 20,
  totalCount: totalPages * 20,
  totalPages,
});

const step = (label: string) => PAGE_STEPS.find((candidate) => candidate.label === label)!;

describe("pagination steps", () => {
  it("jumps to the ends rather than stepping there", () => {
    expect(step("First page").target(meta(40, 41))).toBe(1);
    expect(step("Last page").target(meta(2, 41))).toBe(41);
  });

  it("steps one at a time in the middle", () => {
    expect(step("Previous page").target(meta(5, 41))).toBe(4);
    expect(step("Next page").target(meta(5, 41))).toBe(6);
  });

  // Nothing should offer a page that does not exist.
  it("disables both backward steps on the first page", () => {
    expect(step("First page").atEdge(meta(1, 41))).toBe(true);
    expect(step("Previous page").atEdge(meta(1, 41))).toBe(true);
    expect(step("Next page").atEdge(meta(1, 41))).toBe(false);
  });

  it("disables both forward steps on the last page", () => {
    expect(step("Next page").atEdge(meta(41, 41))).toBe(true);
    expect(step("Last page").atEdge(meta(41, 41))).toBe(true);
    expect(step("Previous page").atEdge(meta(41, 41))).toBe(false);
  });

  it("disables everything when there is a single page", () => {
    expect(PAGE_STEPS.every((candidate) => candidate.atEdge(meta(1, 1)))).toBe(true);
  });
});
