import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "@/lib/auth/token-storage";

export const AXIOS_INSTANCE = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8001",
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------- Request interceptor: attach access token ----------
AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- Response interceptor: 401 → refresh → retry ----------
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
}

AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh for 401 errors, not for login/refresh endpoints themselves
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh") &&
      !originalRequest.url?.includes("/auth/register")
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(AXIOS_INSTANCE(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clearTokens();
        isRefreshing = false;
        processQueue(error, null);
        // Dispatch event so AuthProvider can react
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(error);
      }

      try {
        const { data } = await AXIOS_INSTANCE.post("/api/v1/auth/refresh", {
          refresh_token: refreshToken,
        });

        tokenStorage.setTokens(data.access_token, data.refresh_token);
        isRefreshing = false;
        processQueue(null, data.access_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return AXIOS_INSTANCE(originalRequest);
      } catch (refreshError) {
        tokenStorage.clearTokens();
        isRefreshing = false;
        processQueue(refreshError, null);

        // Distinguish deactivation (403) from session expiry (401/other)
        const refreshStatus = axios.isAxiosError(refreshError)
          ? refreshError.response?.status
          : undefined;
        if (refreshStatus === 403) {
          window.dispatchEvent(new Event("auth:deactivated"));
        } else {
          window.dispatchEvent(new Event("auth:session-expired"));
        }
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshError);
      }
    }

    // Log 5xx errors
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status && status >= 500) {
        console.error(`[API] Server error ${status}:`, error.message);
      }
    }

    return Promise.reject(error);
  }
);

export type PromiseWithCancel<T> = Promise<T> & {
  cancel: () => void;
};

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): PromiseWithCancel<T> => {
  const controller = new AbortController();

  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    // Merge headers from both config and options instead of letting options overwrite
    headers: { ...config.headers, ...options?.headers },
    signal: controller.signal,
  }).then(({ data }) => data);

  const promiseWithCancel = promise as PromiseWithCancel<T>;

  promiseWithCancel.cancel = () => {
    controller.abort("Query was cancelled");
  };

  return promiseWithCancel;
};
