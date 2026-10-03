"use client";

import { useApiList, useApiMutation, useApiQuery } from "@/api/hooks";
import { createQueryKeys } from "@/api/query-keys";
import type { ListParams } from "@/types/api";

export interface CrudEndpoints {
  list: string;
  byId: (id: string) => string;
}

/** The five hooks every resource repeats — list, one, create, update, delete — wired to
 *  one query key, so every write invalidates every list and detail of that resource.
 *
 *  `export const ordersApi = createCrudApi<Order, CreateOrderBody, UpdateOrderBody>(
 *     "orders", API.orders);`
 *
 *  Anything the resource has beyond CRUD stays a hand-written `useApiMutation` next to
 *  it, invalidating `<resource>Api.keys.all` — see `useChangeUserRole`. */
export function createCrudApi<T, TCreate = Partial<T>, TUpdate = Partial<TCreate>>(
  scope: string,
  endpoints: CrudEndpoints,
) {
  const keys = createQueryKeys(scope);
  const invalidate = [keys.all];

  function useList(params: ListParams) {
    return useApiList<T>({ queryKey: keys.list(params), url: endpoints.list, params });
  }

  function useOne(id: string) {
    return useApiQuery<T>({ queryKey: keys.detail(id), url: endpoints.byId(id) });
  }

  function useCreate() {
    return useApiMutation<T, TCreate>({ method: "post", url: endpoints.list, invalidate });
  }

  /** The id addresses the URL, `data` is the payload — sending the id too would write it. */
  function useUpdate() {
    return useApiMutation<T, { id: string; data: TUpdate }>({
      method: "patch",
      url: ({ id }) => endpoints.byId(id),
      body: ({ data }) => data,
      invalidate,
    });
  }

  function useRemove() {
    return useApiMutation<void, string>({
      method: "delete",
      url: (id) => endpoints.byId(id),
      invalidate,
    });
  }

  return { keys, useList, useOne, useCreate, useUpdate, useRemove };
}
