import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/services/auth.service"; 
import { axiosPublic } from "@/API/axiosIntance";

interface AuthState {
  user: any | null;
  accessToken: string | null;
  setAuth: (user: any, token: string | null) => void;
  handleRefreshToken: () => Promise<string>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,

      setAuth: (user, accessToken) => set({ user, accessToken }),

      handleRefreshToken: async () => {
        // Interceptor sẽ gọi hàm này khi token hết hạn
        const api = authService(axiosPublic);
        const { data } = await api.refreshToken();
        set({ accessToken: data.accessToken });
        return data.accessToken;
      },

      clearAuth: () => {
        set({ user: null, accessToken: null });
        localStorage.removeItem("auth-storage");
      },
    }),
    { name: "auth-storage" }
  )
);
