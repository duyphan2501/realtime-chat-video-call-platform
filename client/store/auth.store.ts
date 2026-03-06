import { authAPI } from "@/API/authAPI";
import { axiosPublic } from "@/API/axiosIntance";
import { create } from "zustand";

interface AuthState {
  user: any | null;
  accessToken: string | null;
  isSessionExpired: boolean;
  setSessionExpired: (status: boolean) => void;
  setAuth: (user: any, token: string | null) => void;
  handleRefreshToken: () => Promise<string>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  accessToken: null,
  isSessionExpired: false,
  setSessionExpired: (status) => set({ isSessionExpired: status }),

  setAuth: (user, accessToken = null) => {
    if (!accessToken) accessToken = get().accessToken;
    set({ user, accessToken });
  },

  handleRefreshToken: async () => {
    const api = authAPI(axiosPublic);
    const { data } = await api.refreshToken();
    get().setAuth(data.user, data.accessToken)
    return data.accessToken;
  },

  clearAuth: () => {
    set({ user: null, accessToken: null });
  },
}));
