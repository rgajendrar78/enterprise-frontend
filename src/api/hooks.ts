import {
  type QueryKey,
  type UseMutationResult,
  type UseQueryResult,
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { http } from "@/api/client";
import type { ApiResponse, ListParams, ListResult, PaginationMeta } from "@/types/api";

const EMPTY_META: PaginationMeta = { page: 1, limit: 0, totalCount: 0, totalPages: 1 };

interface QueryOptions {
  queryKey: QueryKey;
  url: string;
  params?: Record<string, unknown>;
  enabled?: boolean;
}

export function useApiQuery<T>({
  queryKey,
  url,
  params,
  enabled = true,
}: QueryOptions): UseQueryResult<T> {
  return useQuery({
    queryKey,
    enabled,
    queryFn: async ({ signal }) => {
      const response = await http.get<ApiResponse<T>>(url, { params, signal });
      return response.data.data;
    },
  });
}

export function useApiList<T>({
  queryKey,
  url,
  params,
  enabled = true,
}: Omit<QueryOptions, "params"> & { params: ListParams }): UseQueryResult<ListResult<T>> {
  return useQuery({
    queryKey,
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const response = await http.get<ApiResponse<T[]>>(url, { params, signal });
      return { items: response.data.data, meta: response.data.meta ?? EMPTY_META };
    },
  });
}

interface MutationOptions<TData, TBody> {
  method: "post" | "patch" | "put" | "delete";
  url: string | ((body: TBody) => string);
  body?: (variables: TBody) => unknown;
  params?: Record<string, unknown> | ((variables: TBody) => Record<string, unknown>);
  invalidate?: QueryKey[];
  successMessage?: string;
  onSuccess?: (data: TData) => void;
}

export function useApiMutation<TData, TBody = void>({
  method,
  url,
  body,
  params,
  invalidate = [],
  successMessage,
  onSuccess,
}: MutationOptions<TData, TBody>): UseMutationResult<TData, Error, TBody> {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TBody>({
    mutationFn: async (variables) => {
      const path = typeof url === "function" ? url(variables) : url;
      /** Only an object is a payload; a scalar addresses the URL. Sending one anyway
       *  makes axios write a bare string that `express.json()` rejects with a 400. */
      const data = body
        ? body(variables)
        : typeof variables === "object" && variables !== null
          ? variables
          : undefined;
      const query = typeof params === "function" ? params(variables) : params;
      const response = await http.request<ApiResponse<TData>>({
        method,
        url: path,
        data,
        params: query,
      });
      // Toasted here, where this call's own message is in scope. Holding it in a ref
      // for `onSuccess` lets two concurrent mutations overwrite each other's wording.
      const message = successMessage ?? response.data.message;
      if (message) toast.success(message);
      return response.data.data;
    },
    onSuccess: async (data) => {
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
      onSuccess?.(data);
    },
  });
}
