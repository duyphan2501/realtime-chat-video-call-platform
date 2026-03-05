import { axiosPublic } from "@/API/axiosIntance";
import { AxiosInstance } from "axios";

export const authService = (axiosPrivate: AxiosInstance) => ({
  // Các API không cần token (Dùng axiosPublic trực tiếp)
  login: (data: any) => 
    axiosPublic.post("/auth/login", data),

  googleLogin: (token: string) => 
    axiosPublic.post("/auth/google", { token }),

  refreshToken: () => 
    axiosPublic.post("/auth/refresh-token"),

  // Các API CẦN token và cơ chế Silent Refresh (Dùng axiosPrivate)
  logout: () => 
    axiosPrivate.post("/auth/logout"),
});
