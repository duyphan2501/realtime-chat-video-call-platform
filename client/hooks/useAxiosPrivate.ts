"use client";
import { useEffect } from "react";
import { axiosPrivate } from "@/API/axiosIntance";
import { useAuthStore } from "@/store";
import { useMyContext } from "@/context/MyContext";
import { InternalAxiosRequestConfig } from "axios";

interface CustomAxiosConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

const useAxiosPrivate = () => {
  const handleRefreshToken = useAuthStore((s) => s.handleRefreshToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { persist } = useMyContext(); 

  useEffect(() => {
    // 1. Request Interceptor: Gắn Access Token từ RAM (Zustand)
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 2. Response Interceptor: Silent Refresh
    const responseIntercept = axiosPrivate.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config as CustomAxiosConfig;

        // CHỈ REFRESH KHI: Lỗi 401 + Chưa retry + User CHỌN "Ghi nhớ" (persist)
        if (error.response?.status === 401 && !originalRequest._retry && persist) {
          
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosPrivate(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            // Gọi hàm refresh trong Store (sử dụng axiosPublic)
            const newToken = await handleRefreshToken();
            
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            return axiosPrivate(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            clearAuth(); // Refresh thất bại (hết hạn cả Refresh Token) -> Logout
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
      axiosPrivate.interceptors.response.eject(responseIntercept);
    };
  }, [handleRefreshToken, clearAuth, persist]);

  return axiosPrivate;
};

export default useAxiosPrivate;
