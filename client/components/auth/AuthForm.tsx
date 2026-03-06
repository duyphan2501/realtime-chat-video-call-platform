"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { SubmitEvent, useState } from "react";
import GoogleButton from "./GoogleButton";
import toast from "react-hot-toast";
import IconLoading from "../IconLoading";
import { useMyContext } from "@/context/MyContext";
import { useAuthService } from "@/services";

const AuthForm = () => {
  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { persist, setPersist } = useMyContext();
  const { login, isLoggingIn } = useAuthService();

  const handleLogin = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill all fields");
      return;
    }
    await login({ email, password });
  };

  return (
    <div className="w-full max-w-110 shadow-xl">
      <div className="bg-dark-secondary! rounded-xl shadow-xl overflow-hidden text-white">
        {/* Tabs */}
        <div className="flex relative">
          <button
            className={`flex-1 py-4 text-sm font-bold cursor-pointer transition hover:text-blue ${tab === 0 && "text-blue"}`}
            onClick={() => setTab(0)}
          >
            Login
          </button>
          <button
            className={`flex-1 py-4 text-sm font-bold cursor-pointer transition hover:text-blue ${tab !== 0 && "text-blue"}`}
            onClick={() => setTab(1)}
          >
            Sign Up
          </button>
          <div
            className={`absolute h-0.5 bg-blue bottom-0 z-10 w-1/2 ${tab !== 0 && "right-0"}`}
          ></div>
        </div>
        {/* Form */}
        <section className="p-8">
          <h4 className="text-xl font-bold subtitle mb-2">Welcome Back</h4>
          <p className="text-sm mb-5 text-gray-400">
            Enter your credentials to access your account
          </p>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="text-sm font-semibold" htmlFor="email">
                Email
              </label>
              <div className="flex items-center gap-2 mt-2 px-4 py-3 rounded-lg bg-dark-gray border border-gray-700">
                <Mail className="text-gray-500" />
                <input
                  type="text"
                  placeholder="Email"
                  className="w-full outline-0"
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
              <div className="flex justify-between mt-2 px-4 py-3 rounded-lg bg-dark-gray border border-gray-700">
                <div className="flex items-center gap-2 flex-1">
                  <Lock className="text-gray-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full outline-0"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div
                  className="z-2 ps-2"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff className="text-gray-600 cursor-pointer active:text-gray-400 transition" />
                  ) : (
                    <Eye className="text-gray-600 cursor-pointer active:text-gray-400 transition" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <label className="label">
                <input
                  type="checkbox"
                  value={persist ? "true" : "false"}
                  checked={persist}
                  onChange={(e) => setPersist(e.target.checked)}
                  className="checkbox checkbox-primary"
                />
                Remember me
              </label>
              <a
                href="/auth/forgot-password"
                className="text-blue italic text-sm hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <button
              className="w-full h-14 bg-primary text-white font-bold flex justify-center items-center rounded-lg hover:bg-blue-800 cursor-pointer"
              disabled={isLoggingIn}
              type="submit"
            >
              {isLoggingIn ? <IconLoading size={26} /> : "Log In"}
            </button>
          </form>
          <div className="flex items-center justify-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-600"></div>
            <div className="text-gray-400 uppercase text-sm">
              Or continue with
            </div>
            <div className="flex-1 h-px bg-gray-600"></div>
          </div>
          <div className="">
            <GoogleButton isLogin={true} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthForm;
