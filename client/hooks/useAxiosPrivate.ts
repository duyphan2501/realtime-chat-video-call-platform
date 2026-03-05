import { useContext, useEffect } from "react";
import { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { axiosPrivate } from "@/API/axiosIntance";
import useAuthStore from "@/store/auth.store";
import { useMyContext } from "@/context/MyContext";

// Mở rộng interface để Axios nhận diện biến _retry tự tạo
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const useAxiosPrivate = () => {
  const { refreshToken } = useAuthStore();
  const persist = useMyContext().persist;

  useEffect(() => {
    // 1. Request Interceptor
    const requestInterceptor = axiosPrivate.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().accessToken;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 2. Response Interceptor
    const responseInterceptor = axiosPrivate.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        // Chỉ refresh khi lỗi 401 và request chưa từng thử lại
        if (error.response?.status === 401 && !originalRequest._retry && persist === true) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers!.Authorization = `Bearer ${token}`;
                return axiosPrivate(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const data = await refreshToken();
            const newAccessToken = data.accessToken;
            
            processQueue(null, newAccessToken);
            originalRequest.headers!.Authorization = `Bearer ${newAccessToken}`;
            
            return axiosPrivate(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            // useAuthStore.getState().logout();
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosPrivate.interceptors.request.eject(requestInterceptor);
      axiosPrivate.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshToken, persist]);

  return axiosPrivate;
};

export default useAxiosPrivate;
