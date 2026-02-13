"use client";

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import GoogleButton from "./GoogleButton";

const AuthForm = () => {
  const [tab, setTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-6 py-12">
      <div className="w-full max-w-110 shadow-xl">
        <div className="bg-secondary rounded-xl shadow-xl overflow-hidden text-white">
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
            <p className="text-sm mb-5 text-gray-400">Enter your credentials to access your account</p>

            <form className="space-y-6">
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
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold" htmlFor="password">Password</label>
                  <a
                    href="/auth/forgot-password"
                    className="text-blue italic text-sm hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="flex justify-between mt-2 px-4 py-3 rounded-lg bg-dark-gray border border-gray-700">
                  <div className="flex items-center gap-2 flex-1">
                    <Lock className="text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      className="w-full outline-0"
                      id="password"
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

              <button className="w-full bg-primary text-white font-bold py-4 rounded-lg hover:bg-blue-800 cursor-pointer">
                Log In
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
    </div>
  );
};

export default AuthForm;
