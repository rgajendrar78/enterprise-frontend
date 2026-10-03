"use client";

import { createCrudApi } from "@/api/crud";
import { API } from "@/api/endpoints";
import { useApiMutation } from "@/api/hooks";
import type { ChangeRoleVars, CreateUserBody, UpdateUserBody } from "@/features/users/types";
import type { User } from "@/types/user";

/** One data layer for the whole feature, so the list and detail screens share a cache
 *  entry and one invalidation. */
export const usersApi = createCrudApi<User, CreateUserBody, UpdateUserBody>("users", API.users);

/** Role lives on its own endpoint behind its own permission, so it is not part of the
 *  update above — the pattern for anything a resource has beyond CRUD. */
export function useChangeUserRole() {
  return useApiMutation<User, ChangeRoleVars>({
    method: "patch",
    url: ({ id }) => API.users.role(id),
    body: ({ role }) => ({ role }),
    invalidate: [usersApi.keys.all],
  });
}

export function useRestoreUser() {
  return useApiMutation<User, string>({
    method: "patch",
    url: (id) => API.users.restore(id),
    invalidate: [usersApi.keys.all],
  });
}
