import { describe, expect, it } from "vitest";
import { formatDate, formatNumber, initialsOf, toDateInput } from "@/utils/format";

describe("format", () => {
  it("renders a dash instead of Invalid Date", () => {
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
    expect(formatDate("2026-01-15T10:00:00.000Z")).not.toBe("—");
  });

  it("renders a dash for a missing number, but not for zero", () => {
    expect(formatNumber(undefined)).toBe("—");
    expect(formatNumber(0)).toBe("0");
  });

  // `toISOString()` converts to UTC first, so 23:00 on the 5th in Delhi becomes the 5th
  // at 17:30 UTC — fine — but 00:30 on the 6th becomes the 5th, a day the user never picked.
  it("keeps the local date the calendar showed", () => {
    expect(toDateInput(new Date(2026, 0, 6, 0, 30))).toBe("2026-01-06");
    expect(toDateInput(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });

  it("pads month and day to two digits", () => {
    expect(toDateInput(new Date(2026, 8, 9))).toBe("2026-09-09");
  });

  it("takes at most two initials", () => {
    expect(initialsOf("Ada Lovelace")).toBe("AL");
    expect(initialsOf("Ada Byron King Lovelace")).toBe("AB");
    expect(initialsOf("")).toBe("");
  });
});
