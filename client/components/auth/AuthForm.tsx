/* ═══════════════════════════════════════════════════════════
   components/auth/AuthForm.tsx

   TODO — backend integration:
   ① authApi.login()    → POST /auth/login
   ② authApi.register() → POST /auth/register
   ③ Lưu accessToken vào localStorage (hoặc cookie)
   ④ Redirect sang /chat sau khi login thành công
   ═══════════════════════════════════════════════════════════ */
"use client";
import { useState } from "react";
import { authApi } from "@/lib/api";
import GoogleButton from "@/components/GoogleButton";

type Mode = "login" | "register";
type Tab  = "email" | "qr";

export default function AuthForm() {
  const [mode,     setMode]     = useState<Mode>("login");
  const [tab,      setTab]      = useState<Tab>("email");
  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let res: any;

      if (mode === "login") {
        // TODO ①: gọi API login, kiểm tra response shape
        res = await authApi.login(email, password);
      } else {
        // TODO ②: gọi API register
        res = await authApi.register({ fullName, email, password });
      }

      // TODO ③: lưu token — kiểm tra key trả về từ backend của bạn
      //   backend trả về "accessToken" hay "token"?
      if (res.accessToken) {
        localStorage.setItem("accessToken",  res.accessToken);
        localStorage.setItem("refreshToken", res.refreshToken ?? "");
      }

      // TODO ④: redirect
      window.location.href = "/chat";

    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => m === "login" ? "register" : "login");
    setError("");
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-auto" style={{ background: "var(--color-bg)" }}>
      <div className="w-full max-w-[400px] animate-fade-up">

        {/* Mobile logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "var(--color-brand)" }}>
            <ChatIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">ZaloChat</span>
        </div>

        <div className="bg-white rounded-3xl p-8" style={{ boxShadow: "var(--shadow-lg)" }}>
          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--color-ink)" }}>
              {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
            </h2>
            <p className="text-sm" style={{ color: "var(--color-ink-3)" }}>
              {mode === "login" ? "Chào mừng trở lại!" : "Tham gia ZaloChat ngay hôm nay"}
            </p>
          </div>

          {/* Tabs: Email / QR */}
          <div className="flex gap-1 p-1 rounded-2xl mb-6" style={{ background: "var(--color-s2)" }}>
            {(["email", "qr"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: tab === t ? "white" : "transparent",
                  color:      tab === t ? "var(--color-ink)" : "var(--color-ink-3)",
                  boxShadow:  tab === t ? "var(--shadow-xs)" : "none",
                }}
              >
                {t === "email" ? "Email" : "Mã QR"}
              </button>
            ))}
          </div>

          {/* ── Email form ── */}
          {tab === "email" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <Field label="Họ và tên">
                  <Input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={setFullName}
                    required
                  />
                </Field>
              )}

              <Field label="Email">
                <Input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={setEmail}
                  required
                />
              </Field>

              <Field label="Mật khẩu">
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={setPassword}
                    required
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                    style={{ color: "var(--color-ink-4)" }}
                  >
                    {showPw ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              {mode === "login" && (
                <div className="flex justify-end">
                  <button type="button" className="text-sm font-medium transition-colors"
                    style={{ color: "var(--color-brand)" }}>
                    Quên mật khẩu?
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm"
                  style={{ background: "#FEF2F2", color: "var(--color-danger)" }}>
                  <WarnIcon className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-all active:scale-[.98] disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: "var(--color-brand)" }}
              >
                {loading && <SpinIcon className="w-4 h-4 animate-spin" />}
                {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "var(--color-s3)" }} />
                <span className="text-xs" style={{ color: "var(--color-ink-4)" }}>hoặc</span>
                <div className="flex-1 h-px" style={{ background: "var(--color-s3)" }} />
              </div>
              {/* GG Button */}
              <div className="w-full py-3 flex items-center justify-center gap-3 rounded-2xl text-sm font-medium transition-all">
                <GoogleButton isLogin={true} />
              </div>
            </form>

          ) : (
            /* ── QR tab ── */
            <div className="text-center py-2">
              <p className="text-sm mb-5" style={{ color: "var(--color-ink-3)" }}>
                Dùng ứng dụng ZaloChat để quét mã QR
              </p>
              <div className="inline-flex items-center justify-center w-44 h-44 rounded-3xl border-2 border-dashed mb-4"
                style={{ background: "var(--color-s2)", borderColor: "var(--color-s4)" }}>
                <QrIcon className="w-20 h-20" style={{ color: "var(--color-s4)" }} />
              </div>
              <p className="text-xs mb-2" style={{ color: "var(--color-ink-4)" }}>
                Mã hết hạn sau 5 phút
              </p>
              {/* TODO: fetch QR code từ backend */}
              <button className="text-sm font-medium" style={{ color: "var(--color-brand)" }}>
                Làm mới
              </button>
            </div>
          )}

          {/* Mode switch */}
          <p className="text-center text-sm mt-5" style={{ color: "var(--color-ink-3)" }}>
            {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
            <button
              onClick={switchMode}
              className="font-semibold transition-colors"
              style={{ color: "var(--color-brand)" }}
            >
              {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Tiny sub-components ─────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase"
        style={{ color: "var(--color-ink-4)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  onChange, className = "", ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { onChange?: (v: string) => void }) {
  return (
    <input
      {...props}
      onChange={(e) => onChange?.(e.target.value)}
      className={`w-full px-4 py-3 rounded-2xl text-sm outline-none transition-all ${className}`}
      style={{
        background:  "var(--color-s2)",
        color:       "var(--color-ink)",
        border:      "1.5px solid transparent",
      }}
      onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = "var(--color-brand)"; (e.target as HTMLInputElement).style.background = "white"; }}
      onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = "transparent"; (e.target as HTMLInputElement).style.background = "var(--color-s2)"; }}
    />
  );
}

/* ── Icons ───────────────────────────────────────── */
const ChatIcon   = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V5z"/></svg>
);
const EyeIcon    = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const EyeOffIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);
const WarnIcon   = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
);
const SpinIcon   = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
);
const QrIcon     = ({ className, style }: { className: string; style?: React.CSSProperties }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path strokeLinecap="round" d="M14 14h2m0 0h2m-2 0v2m0 2v2m4-4h-2m0 4h2"/></svg>
);
