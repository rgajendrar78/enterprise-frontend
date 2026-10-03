/** Mirrors the backend envelope — see backend README, "API contract". */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errorCode: string;
  details?: unknown;
}

export interface ListResult<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Query string for any list endpoint. Extend it per resource; do not re-declare it. */
export interface ListParams {
  page: number;
  limit: number;
  sort?: string;
  search?: string;
  [filter: string]: string | number | boolean | undefined;
}
