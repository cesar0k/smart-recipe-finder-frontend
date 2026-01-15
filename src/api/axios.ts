import axios, { type AxiosRequestConfig } from 'axios';

export const AXIOS_INSTANCE = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export type PromiseWithCancel<T> = Promise<T> & {
  cancel: () => void;
};

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): PromiseWithCancel<T> => {
  const source = axios.CancelToken.source();

  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  const promiseWithCancel = promise as PromiseWithCancel<T>;

  promiseWithCancel.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promiseWithCancel;
};