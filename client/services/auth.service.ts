import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAPI } from "@/API/useAPI";
import { useAuthStore } from "@/store";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

type LoginCredentials = {
  email: string;
  password: string;
};

type RegisterCredentials = {
  name: string;
  email: string;
  password?: string;
};

type VerifyEmailPayload = {
  email: string;
  code: string;
};

type ForgotPasswordPayload = {
  email: string;
};

type ResetPasswordPayload = {
  email: string;
  code: string;
  newPassword: string;
};

type CheckCodePayload = {
  email: string;
  code: string;
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

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) => api.auth.register(credentials),
    onError: (error: any) => {
      
      // Check lỗi ở console để debug
      console.group("🔴 CHI TIẾT LỖI ĐĂNG KÝ (REGISTER ERROR)");
      console.log("Toàn bộ lỗi Axios:", error);
      console.log("Trạng thái HTTP (Status code):", error.response?.status);
      console.log("Data từ Backend trả về:", error.response?.data);
      console.log("Đường dẫn API đã gọi:", error.config?.baseURL, error.config?.url);
      console.groupEnd();

      const msg = error.response?.data?.message || "Failed to register";
      toast.error(msg);
    },
  });

  const verifyEmailMutation = useMutation({
    mutationFn: (payload: VerifyEmailPayload) => api.auth.verifyEmail(payload),
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to verify email";
      toast.error(msg);
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => api.auth.forgotPassword(payload),
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to send reset password email";
      toast.error(msg);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: ResetPasswordPayload) => api.auth.resetPassword(payload),
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to reset password";
      toast.error(msg);
    },
  });

  const checkResetCodeMutation = useMutation({
    mutationFn: (payload: CheckCodePayload) => api.auth.checkResetCode(payload),
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Mã không hợp lệ";
      toast.error(msg);
    },
  });

  const register = async (data: RegisterCredentials) => {
    try {
      await registerMutation.mutateAsync(data);
      return true;
    } catch (error) {
      return false;
    }
  };

  const verifyEmail = async (data: VerifyEmailPayload) => {
    try {
      await verifyEmailMutation.mutateAsync(data);
      return true;
    } catch (error) {
      return false;
    }
  };

  const forgotPassword = async (data: ForgotPasswordPayload) => {
    try {
      await forgotPasswordMutation.mutateAsync(data);
      return true;
    } catch (error) {
      return false;
    }
  };

  const resetPassword = async (data: ResetPasswordPayload) => {
    try {
      await resetPasswordMutation.mutateAsync(data);
      return true;
    } catch (error) {
      return false;
    }
  };

  const checkResetCode = async (data: CheckCodePayload) => {
    try {
      await checkResetCodeMutation.mutateAsync(data);
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    login: loginMutation.mutateAsync,
    getMe: getMeMutation.mutateAsync,
    googleLogin: googleLoginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
    register,
    isRegistering: registerMutation.isPending,
    verifyEmail,
    isVerifying: verifyEmailMutation.isPending,
    forgotPassword,
    isSendingForgot: forgotPasswordMutation.isPending,
    resetPassword,
    isResetting: resetPasswordMutation.isPending,
    checkResetCode,
    isCheckingCode: checkResetCodeMutation.isPending,
  };
};
