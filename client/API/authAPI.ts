import { axiosPublic } from "@/API/axiosIntance";
import { AxiosInstance } from "axios";

export const authAPI = (axiosPrivate: AxiosInstance) => ({
  login: (data: any) => axiosPublic.post("/auth/login", data),

  googleLogin: (token: string) => axiosPublic.post("/auth/google", { token }),

  refreshToken: () => axiosPublic.put("/auth/refresh-token"),

  logout: () => axiosPublic.delete("/auth/logout"),

  getMe: () => axiosPrivate.get("/auth/me"),
});
