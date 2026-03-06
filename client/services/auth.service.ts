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

  return {
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    googleLogin: googleLoginMutation.mutateAsync,
    logout: clearAuth,
  };
};
