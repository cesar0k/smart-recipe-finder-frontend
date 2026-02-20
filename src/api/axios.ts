import axios, { type AxiosRequestConfig } from "axios";

export const AXIOS_INSTANCE = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8001",
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Global error interceptor for 5xx errors
AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error) => {
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
    signal: controller.signal,
  }).then(({ data }) => data);

  const promiseWithCancel = promise as PromiseWithCancel<T>;

  promiseWithCancel.cancel = () => {
    controller.abort("Query was cancelled");
  };

  return promiseWithCancel;
};
