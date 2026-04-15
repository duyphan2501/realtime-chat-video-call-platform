"use client";

import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  RefreshCw,
} from "lucide-react";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import IconLoading from "../loadings/IconLoading";
import { useAuthService } from "@/services";

interface Props {
  onBack?: () => void;
}

const ForgotPasswordForm = ({ onBack }: Props) => {
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isCodeVerified, setIsCodeVerified] = useState(false);

  const router = useRouter();
  const {
    forgotPassword,
    isSendingForgot,
    resetPassword,
    isResetting,
    checkResetCode,
    isCheckingCode,
  } = useAuthService();

  const handleSendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    const success = await forgotPassword({ email });
    if (success) {
      toast.success("Reset code has been sent to your email!");
      setStep("code");
    }
  };

  const handleVerifyCodeManual = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Vui lòng nhập đủ 6 số.");
      return;
    }
    const success = await checkResetCode({ email, code });
    if (success) {
      setIsCodeVerified(true);
      toast.success("Mã xác thực chính xác!");
      setStep("password");
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Vui lòng nhập mật khẩu mới.");
      return;
    }
    const success = await resetPassword({ email, code, newPassword });
    if (success) {
      toast.success("Password has been reset successfully!");
      if (onBack) onBack();
      else router.back();
    }
  };

  const handleTryAgain = () => {
    setCode("");
    setIsCodeVerified(false);
    setStep("email");
  };

  const handleBackClick = () => {
    if (step === "password") setStep("code");
    else if (step === "code") setStep("email");
    else if (onBack) onBack();
    else router.back();
  };

  return (
    <div className="w-full max-w-110 shadow-xl">
      <div className="bg-dark-secondary! rounded-xl shadow-xl overflow-hidden text-white p-8">
        {/* Nút quay lại trang Đăng nhập */}
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition mb-6 cursor-pointer w-fit"
        >
          <ArrowLeft size={16} />
          Back to Login
        </button>

        {step === "email" ? (
          <section>
            <h4 className="text-xl font-bold subtitle mb-2">Forgot Password</h4>
            <p className="text-sm mb-6 text-gray-400">
              Enter your registered email address to receive a password reset
              code.
            </p>

            <form className="space-y-6" onSubmit={handleSendEmail}>
              <div>
                <label className="text-sm font-semibold" htmlFor="email">
                  Email
                </label>
                <div className="flex items-center gap-2 mt-1.5 px-4 py-3 rounded-lg bg-dark-gray border border-gray-700 focus-within:border-blue transition-colors">
                  <Mail className="text-gray-500" size={20} />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full outline-0 bg-transparent"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                className="w-full h-12 bg-primary text-white font-bold flex justify-center items-center rounded-lg hover:bg-blue-800 cursor-pointer transition disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isSendingForgot}
                type="submit"
              >
                {isSendingForgot ? (
                  <IconLoading size={24} />
                ) : (
                  "Send Reset Code"
                )}
              </button>
            </form>
          </section>
        ) : step === "code" ? (
          <section>
            <h4 className="text-xl font-bold subtitle mb-2">Verify Code</h4>
            <p className="text-sm mb-6 text-gray-400">
              We've sent a 6-digit code to{" "}
              <span className="font-semibold text-white">{email}</span>.
            </p>

            <form className="space-y-5" onSubmit={handleVerifyCodeManual}>
              {/* Verification Code */}
              <div>
                <label className="text-sm font-semibold" htmlFor="code">
                  Verification Code
                </label>
                <div className="relative flex items-center mt-1.5">
                  <input
                    type="text"
                    placeholder="Enter code..."
                    className={`w-full outline-0 bg-dark-gray border px-4 py-3 rounded-lg transition-colors text-center text-xl tracking-[0.5em] font-mono ${isCodeVerified ? "border-green-500" : "border-gray-700 focus:border-blue"}`}
                    id="code"
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/[^0-9]/g, ""))
                    }
                    maxLength={6}
                  />
                  <div className="absolute right-4 flex items-center justify-center">
                    {isCheckingCode ? (
                      <RefreshCw
                        size={20}
                        className="text-gray-400 animate-spin"
                      />
                    ) : isCodeVerified ? (
                      <CheckCircle size={22} className="text-green-500" />
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                className="w-full h-12 mt-2 bg-primary text-white font-bold flex justify-center items-center rounded-lg hover:bg-blue-800 cursor-pointer transition disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isCheckingCode || isCodeVerified}
                type="submit"
              >
                {isCheckingCode ? <IconLoading size={24} /> : "Verify Code"}
              </button>
            </form>

            <div className="mt-5 text-center">
              <button
                onClick={handleTryAgain}
                className="text-sm text-gray-400 hover:text-white transition cursor-pointer"
              >
                Didn't receive the code? Try again
              </button>
            </div>
          </section>
        ) : (
          <section>
            <h4 className="text-xl font-bold subtitle mb-2">
              Set New Password
            </h4>
            <p className="text-sm mb-6 text-gray-400">
              Please enter your new password below.
            </p>

            <form className="space-y-5" onSubmit={handleResetPassword}>
              {/* New Password */}
              <div>
                <label className="text-sm font-semibold" htmlFor="newPassword">
                  New Password
                </label>
                <div className="flex justify-between mt-1.5 px-4 py-3 rounded-lg bg-dark-gray border border-gray-700 focus-within:border-blue transition-colors">
                  <div className="flex items-center gap-2 flex-1">
                    <Lock className="text-gray-500" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="New Password"
                      className="w-full outline-0 bg-transparent"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div
                    className="z-2 ps-2 flex items-center cursor-pointer"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff
                        className="text-gray-600 active:text-gray-400 transition"
                        size={20}
                      />
                    ) : (
                      <Eye
                        className="text-gray-600 active:text-gray-400 transition"
                        size={20}
                      />
                    )}
                  </div>
                </div>
              </div>

              <button
                className="w-full h-12 mt-2 bg-primary text-white font-bold flex justify-center items-center rounded-lg hover:bg-blue-800 cursor-pointer transition disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isResetting}
                type="submit"
              >
                {isResetting ? <IconLoading size={24} /> : "Update Password"}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
