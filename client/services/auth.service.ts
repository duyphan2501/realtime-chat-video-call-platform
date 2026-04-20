import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAPI } from "@/API/useAPI";
import { useAuthStore } from "@/store";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { User } from "@/types";

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

type UpdateProfilePayload = {
  name?: string;
  bio?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  avatar?: File | null;
};

export const useAuthService = () => {
  const api = useAPI();
  const uploadApi = api.upload;
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
    onError: () => {
      clearAuth();
      queryClient.clear();
      router.push("/auth");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.auth.logout(),
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      router.push("/auth");
      toast.success("Logged out successfully");
    },
  });

  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterCredentials) =>
      api.auth.register(credentials),
    onError: (error: any) => {
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
    mutationFn: (payload: ForgotPasswordPayload) =>
      api.auth.forgotPassword(payload),
    onError: (error: any) => {
      const msg =
        error.response?.data?.message || "Failed to send reset password email";
      toast.error(msg);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (payload: ResetPasswordPayload) =>
      api.auth.resetPassword(payload),
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to reset password";
      toast.error(msg);
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const { avatar, ...profileFields } = payload;
      let uploadedAvatarUrl: string | undefined;
      if (avatar) {
        const formData = new FormData();
        formData.append("files", avatar);
        const res = await uploadApi.uploadImages(formData);
        if (res.data.uploadedImages?.[0]) {
          uploadedAvatarUrl = res.data.uploadedImages[0].url;
        }
      }
      return api.auth.updateProfile({ ...profileFields, avatar: uploadedAvatarUrl });
    },
    onSuccess: (res) => {
      toast.success(res.data?.message || "Cập nhật thông tin thành công");
      const currentUser = useAuthStore.getState().user;
      const accessToken = useAuthStore.getState().accessToken;
      if (currentUser && accessToken && res.data?.user) {
        setAuth(res.data.user as User, accessToken);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Cập nhật thất bại");
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
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
  };
};
