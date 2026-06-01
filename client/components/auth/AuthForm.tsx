"use client";

import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import React, { useState } from "react";
import GoogleButton from "./GoogleButton";
import toast from "react-hot-toast";
import IconLoading from "../loadings/IconLoading";
import { useMyContext } from "@/context/MyContext";
import { useAuthService } from "@/services";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

const AuthForm = () => {
  const [tab, setTab] = useState(0);
  const [step, setStep] = useState<"auth" | "verify">("auth");
  const [isForgot, setIsForgot] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const { persist, setPersist } = useMyContext();
  // Giả định useAuthService sẽ trả về thêm các hàm và state này.
  // Bạn cần cập nhật auth.service.ts để có thêm register, verifyEmail.
  const {
    login,
    isLoggingIn,
    register,
    verifyEmail,
    isRegistering,
    isVerifying,
  } = useAuthService();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (tab === 0) {
      // Login
      if (!email || !password) {
        toast.error("Please fill all fields");
        return;
      }
      await login({ email, password });
    } else {
      // Register
      if (!name || !email || !password) {
        toast.error("Please fill all fields");
        return;
      }
      // Gọi hàm register (cần được implement trong service)
      if (register) {
        const success = await register({ name, email, password });
        if (success) {
          setStep("verify");
          toast.success("Verification code has been sent to your email!");
        }
      } else {
        toast.error("Register function is not implemented in service yet.");
      }
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!code) {
      toast.error("Please enter verification code");
      return;
    }
    if (verifyEmail) {
      const success = await verifyEmail({ email, code });
      if (success) {
        toast.success("Registration successful! Please log in.");
        setStep("auth");
        setTab(0);
      }
    } else {
      toast.error("Verify function is not implemented in service yet.");
    }
  };

  const isLoading = isLoggingIn || isRegistering || isVerifying;

  if (isForgot) {
    return <ForgotPasswordForm onBack={() => setIsForgot(false)} />;
  }

  return (
    <div className="flex min-h-dvh w-full shadow-xl sm:min-h-0 sm:max-w-110">
      <div className="flex min-h-dvh w-full flex-col overflow-hidden bg-dark-secondary! text-white shadow-xl sm:min-h-0 sm:rounded-xl">
        {step === "auth" ? (
          <>
            {/* Tabs */}
            <div className="flex relative">
              <button
                className={`flex-1 py-4 text-sm font-bold cursor-pointer transition hover:text-blue ${tab === 0 ? "text-blue" : ""}`}
                onClick={() => setTab(0)}
                type="button"
              >
                Login
              </button>
              <button
                className={`flex-1 py-4 text-sm font-bold cursor-pointer transition hover:text-blue ${tab === 1 ? "text-blue" : ""}`}
                onClick={() => setTab(1)}
                type="button"
              >
                Sign Up
              </button>
              <div
                className={`absolute h-0.5 bg-blue bottom-0 z-10 w-1/2 transition-transform duration-300 ${tab === 1 ? "translate-x-full" : ""}`}
              ></div>
            </div>

            {/* Auth Form */}
            <section className="flex flex-1 flex-col justify-center p-5 sm:block sm:p-8">
              <h4 className="text-xl font-bold subtitle mb-2">
                {tab === 0 ? "Welcome Back" : "Create Account"}
              </h4>
              <p className="text-sm mb-5 text-gray-400">
                {tab === 0
                  ? "Enter your credentials to access your account"
                  : "Sign up to get started"}
              </p>

              <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                {tab === 1 && (
                  <div>
                    <label className="text-sm font-semibold" htmlFor="name">
                      Full Name
                    </label>
                    <div className="flex items-center gap-2 mt-1.5 px-4 py-3 rounded-lg bg-dark-gray border border-gray-700 focus-within:border-blue transition-colors">
                      <User className="text-gray-500" size={20} />
                      <input
                        type="text"
                        placeholder="Fullname"
                        className="w-full outline-0 bg-transparent"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold" htmlFor="email">
                    Email
                  </label>
                  <div className="flex items-center gap-2 mt-1.5 px-4 py-3 rounded-lg bg-dark-gray border border-gray-700 focus-within:border-blue transition-colors">
                    <Mail className="text-gray-500" size={20} />
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full outline-0 bg-transparent"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold" htmlFor="password">
                    Password
                  </label>
                  <div className="flex justify-between mt-1.5 px-4 py-3 rounded-lg bg-dark-gray border border-gray-700 focus-within:border-blue transition-colors">
                    <div className="flex items-center gap-2 flex-1">
                      <Lock className="text-gray-500" size={20} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="w-full outline-0 bg-transparent"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div
                      className="z-2 ps-2 flex items-center"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? (
                        <EyeOff
                          className="text-gray-600 cursor-pointer active:text-gray-400 transition"
                          size={20}
                        />
                      ) : (
                        <Eye
                          className="text-gray-600 cursor-pointer active:text-gray-400 transition"
                          size={20}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {tab === 0 && (
                  <div className="flex justify-between items-center pt-2">
                    <label className="label flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={persist}
                        onChange={(e) => setPersist(e.target.checked)}
                        className="checkbox checkbox-sm checkbox-primary rounded"
                      />
                      <span className="text-sm text-gray-300">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgot(true)}
                      className="text-blue italic text-sm hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  className="w-full h-12 mt-2 bg-primary text-white font-bold flex justify-center items-center rounded-lg hover:bg-blue-800 cursor-pointer transition disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? (
                    <IconLoading size={24} />
                  ) : tab === 0 ? (
                    "Log In"
                  ) : (
                    "Sign Up"
                  )}
                </button>
              </form>

              <div className="flex items-center justify-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-700"></div>
                <div className="text-gray-400 uppercase text-xs font-semibold tracking-wider">
                  Or continue with
                </div>
                <div className="flex-1 h-px bg-gray-700"></div>
              </div>
              <div>
                <GoogleButton isLogin={tab === 0} />
              </div>
            </section>
          </>
        ) : (
          // Verification Step
          <section className="flex flex-1 flex-col justify-center p-5 sm:block sm:p-8">
            <h4 className="text-xl font-bold subtitle mb-2">
              Verify your email
            </h4>
            <p className="text-sm mb-6 text-gray-400">
              We&apos;ve sent a 6-digit verification code to{" "}
              <span className="font-semibold text-white">{email}</span>.
            </p>

            <form className="space-y-6" onSubmit={handleVerify}>
              <div>
                <label className="text-sm font-semibold" htmlFor="code">
                  Verification Code
                </label>
                <div className="flex items-center mt-1.5">
                  <input
                    type="text"
                    placeholder="Enter code here..."
                    className="w-full outline-0 bg-dark-gray border border-gray-700 px-4 py-3 rounded-lg focus:border-blue transition-colors text-center text-xl tracking-[0.5em] font-mono"
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                className="w-full h-12 bg-primary text-white font-bold flex justify-center items-center rounded-lg hover:bg-blue-800 cursor-pointer transition disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? <IconLoading size={24} /> : "Verify Account"}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setStep("auth")}
                className="text-sm text-gray-400 hover:text-white transition"
                type="button"
              >
                Back to Sign Up
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
