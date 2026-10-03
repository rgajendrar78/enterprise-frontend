import type { ListParams } from "@/types/api";

/** Uniform keys, so `invalidate: [keys.all]` always covers every list and detail of a resource. */
export function createQueryKeys<T extends string>(scope: T) {
  return {
    all: [scope] as const,
    detail: (id: string) => [scope, "detail", id] as const,
    list: (params: ListParams) => [scope, "list", params] as const,
  };
}
