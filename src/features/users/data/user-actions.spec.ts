import { describe, expect, it, vi } from "vitest";
import { ROLE } from "@/constants/app";
import { buildUserActions } from "@/features/users/data/user-actions";
import type { User } from "@/types/user";

const handlers = {
  onDelete: vi.fn(),
  onRestore: vi.fn(),
  currentUserId: "me",
};

const user = (over: Partial<User> = {}): User =>
  ({
    id: "u1",
    profile: { name: "Ada", imageUrl: null },
    role: ROLE.USER,
    isActive: true,
    deletedAt: null,
    ...over,
  }) as User;

const labelsFor = (row: User, options = {}) =>
  buildUserActions({ ...handlers, ...options })
    .filter((action) => !action.hidden?.(row))
    .map((action) => action.label);

describe("buildUserActions", () => {
  // The list wants both ways in; the detail screen is already the view and has its own
  // Edit button. One definition, two shapes — no second list to keep in step.
  it("includes an action only when its handler is given", () => {
    const list = labelsFor(user(), { onView: vi.fn(), onEdit: vi.fn() });
    const detail = labelsFor(user());

    expect(list).toContain("View");
    expect(list).toContain("Edit");
    expect(detail).not.toContain("View");
    expect(detail).not.toContain("Edit");
    expect(detail).toContain("Remove");
  });

  it("hides what the API would refuse anyway", () => {
    expect(labelsFor(user({ id: "me" }))).not.toContain("Remove");
    expect(labelsFor(user({ deletedAt: "2026-01-01" }), { onEdit: vi.fn() })).not.toContain("Edit");
  });

  it("offers Restore only for a deleted row", () => {
    expect(labelsFor(user())).not.toContain("Restore");
    expect(labelsFor(user({ deletedAt: "2026-01-01" }))).toContain("Restore");
  });
});
