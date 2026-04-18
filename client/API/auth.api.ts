import { AxiosInstance } from "axios";
import { axiosPublic } from "@/API/axiosIntance";

export const authAPI = (axiosPrivate: AxiosInstance) => ({
  login: (data: any) => axiosPublic.post("/auth/login", data),

  register: (data: any) => axiosPublic.post('/auth/register', data),

  verifyEmail: (data: any) => axiosPublic.post('/auth/verify', data),

  googleLogin: (token: string) => axiosPublic.post("/auth/google", { token }),

  refreshToken: () => axiosPublic.put("/auth/refresh-token"),

  logout: () => axiosPublic.delete("/auth/logout"),

  getMe: () => axiosPrivate.get("/auth/me"),

  forgotPassword: (data: { email: string }) => axiosPublic.post("/auth/forgot-password", data),

  resetPassword: (data: any) => axiosPublic.post("/auth/reset-password", data),

  updateProfile: (data: any) => axiosPrivate.put("/auth/profile", data),
});
