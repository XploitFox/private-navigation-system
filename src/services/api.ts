import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type { AuthTokensResponse } from './authService';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Important for cookies
});

type RetryableRequestConfig = {
  _retry?: boolean;
  url?: string;
  headers?: Record<string, string>;
};

const setDefaultAuthorization = (accessToken: string | null) => {
  if (accessToken) {
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    return;
  }

  delete api.defaults.headers.common['Authorization'];
};

const setRequestAuthorization = (config: RetryableRequestConfig, accessToken: string) => {
  config.headers = {
    ...(config.headers || {}),
    Authorization: `Bearer ${accessToken}`,
  };
};

export const applySessionToken = (accessToken: string) => {
  useAuthStore.getState().setSession(accessToken);
  setDefaultAuthorization(accessToken);
};

export const clearSessionToken = () => {
  useAuthStore.getState().logout();
  setDefaultAuthorization(null);
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      setRequestAuthorization(config as RetryableRequestConfig, token);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency handling for token refresh
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = [];

const isAuthRequest = (url?: string) => {
  return url?.includes('/auth/login') || url?.includes('/auth/refresh') || url?.includes('/auth/logout');
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });

  failedQueue = [];
};

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const requestUrl = originalRequest?.url;

    // If 401 and not retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest(requestUrl)) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            setRequestAuthorization(originalRequest, token);
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post<AuthTokensResponse>('/api/auth/refresh', {}, { withCredentials: true });
        const { accessToken } = response.data;

        applySessionToken(accessToken);
        setRequestAuthorization(originalRequest, accessToken);

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearSessionToken();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
