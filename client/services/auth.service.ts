import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAPI } from "@/hooks/useAPI";
import { useAuthStore } from "@/store";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

type LoginCredentials = {
  email: string;
  password: string;
};

export const useAuthService = () => {
  const api = useAPI();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setSessionExpired = useAuthStore((s) => s.setSessionExpired);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleAuthSuccess = (data: any) => {
    setAuth(data.user, data.accessToken);
    queryClient.clear();
    toast.success("Welcome back!");
    router.push("/");
  };

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => api.auth.login(credentials),
    onSuccess: (res) => handleAuthSuccess(res.data),
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to login";
      toast.error(msg);
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: (tokenId: string) => api.auth.googleLogin(tokenId),
    onSuccess: (res) => handleAuthSuccess(res.data),
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to login google";
      toast.error(msg);
    },
  });

  const getMeMutation = useMutation({
    mutationFn: () => api.auth.getMe(),
    onSuccess: (res) => setAuth(res.data.user, res.data.accessToken),
    onError: () => setSessionExpired(true),
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.auth.logout(),
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      router.push("/login");
      toast.success("Logged out successfully");
    },
  });

  return {
    login: loginMutation.mutateAsync,
    getMe: getMeMutation.mutateAsync,
    googleLogin: googleLoginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
  };
};
