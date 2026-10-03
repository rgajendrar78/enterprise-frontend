import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PermissionGate } from "@/components/shared/permission-gate";
import { PERMISSION, ROLE } from "@/constants/app";
import { hasPermission, useAuthStore } from "@/stores/auth.store";
import type { AuthUser } from "@/types/user";

const signedIn = (permissions: AuthUser["permissions"]) =>
  useAuthStore.setState({
    user: {
      id: "u1",
      email: "a@b.c",
      role: ROLE.USER,
      permissions,
      profile: { name: "A", imageUrl: null },
    },
  });

describe("permission gating", () => {
  it("is false for a signed-out user, not a crash", () => {
    expect(hasPermission(null, PERMISSION.USERS_READ)).toBe(false);
  });

  it("grants only the permissions the session actually carries", () => {
    const user = { permissions: [PERMISSION.USERS_READ] } as AuthUser;
    expect(hasPermission(user, PERMISSION.USERS_READ)).toBe(true);
    expect(hasPermission(user, PERMISSION.USERS_DELETE)).toBe(false);
  });

  it("renders the fallback instead of the action it would refuse", () => {
    signedIn([PERMISSION.USERS_READ]);
    render(
      <PermissionGate permission={PERMISSION.USERS_DELETE} fallback={<span>nothing</span>}>
        <button>Delete</button>
      </PermissionGate>,
    );

    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(screen.getByText("nothing")).toBeTruthy();
  });

  it("renders the action once the permission is there", () => {
    signedIn([PERMISSION.USERS_DELETE]);
    render(
      <PermissionGate permission={PERMISSION.USERS_DELETE}>
        <button>Delete</button>
      </PermissionGate>,
    );

    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
  });
});
