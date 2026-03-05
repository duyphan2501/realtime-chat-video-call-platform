import { API } from "@/API/axiosIntance";
import { create } from "zustand";

interface User {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  refreshToken: () => Promise<{ accessToken: string }>;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,

  setUser: (user) => set({ user }),

  setAccessToken: (token) => set({ accessToken: token }),

  refreshToken: async () => {
    try {
      const response = await API.post("/auth/refresh-token");
      const { accessToken } = response.data;
      set({ accessToken });
      return { accessToken };
    } catch (error) {
      get().logout();
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await API.post("/auth/login", { email, password });
      const { user, accessToken } = response.data;
      set({ user, accessToken });
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      await API.post("/auth/logout");
    } finally {
      set({ user: null, accessToken: null });
      // Xóa các dữ liệu nhạy cảm khác nếu cần
    }
  },

  googleLogin: async (token: string) => {
    try {
      const response = await API.post("/auth/google", { token });
      const { user, accessToken } = response.data;
      set({ user, accessToken });
    } catch (error) {
      throw error;
    }
  },
}));

export default useAuthStore;
