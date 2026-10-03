import axios, { type InternalAxiosRequestConfig } from "axios";
import { API } from "@/api/endpoints";
import { env } from "@/config/env";
import { HTTP, LOGGING } from "@/constants/config";
import { useAuthStore } from "@/stores/auth.store";
import type { ApiErrorBody, ApiResponse } from "@/types/api";
import type { AuthSession } from "@/types/user";
import { isCanceled } from "@/utils/error";
import { logger } from "@/utils/logger";
import { createRequestId } from "@/utils/request-id";

type RetriableConfig = InternalAxiosRequestConfig & { retried?: boolean };

export const http = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  timeout: HTTP.TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers[LOGGING.REQUEST_ID_HEADER] ??= createRequestId();
  return config;
});

http.interceptors.response.use(undefined, (error: unknown) => {
  if (axios.isAxiosError(error) && !isCanceled(error)) {
    const status = error.response?.status;
    const fields = {
      requestId: error.config?.headers?.[LOGGING.REQUEST_ID_HEADER],
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status,
      errorCode: (error.response?.data as ApiErrorBody | undefined)?.errorCode,
    };
    const summary = `${fields.method} ${fields.url} → ${status ?? "no response"}`;

    logger.warn(summary, fields);
  }
  throw error;
});

// One refresh at a time: parallel 401s must not fire parallel refreshes.
let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setSession, signOut } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    // Bare axios: going through `http` would recurse into this interceptor.
    const { data } = await axios.post<ApiResponse<AuthSession>>(
      `${env.NEXT_PUBLIC_API_URL}${API.auth.refresh}`,
      { refreshToken },
    );
    setSession(data.data);
    return data.data.accessToken;
  } catch {
    signOut();
    return null;
  }
}

http.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error)) throw error;

  const config = error.config as RetriableConfig | undefined;
  const isAuthCall = config?.url?.startsWith("/auth/") ?? false;
  if (error.response?.status !== 401 || !config || config.retried || isAuthCall) throw error;

  config.retried = true;
  refreshInFlight ??= refreshAccessToken().finally(() => {
    refreshInFlight = null;
  });

  const token = await refreshInFlight;
  if (!token) throw error;

  config.headers.Authorization = `Bearer ${token}`;
  return http(config);
});

/**
 * Uploads a file directly to AWS S3 using a Presigned PUT URL.
 * Uses bare `axios` to avoid injecting Authorization headers or JSON defaults
 * which would break the strict AWS signature.
 */
export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  try {
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to upload file to S3: ${error.message} (File might be too large)`);
    }
    throw error;
  }
}
