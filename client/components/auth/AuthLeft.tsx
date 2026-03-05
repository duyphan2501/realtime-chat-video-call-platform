/* ─────────────────────────────────────────────────
   AuthLeft.tsx — panel trang trí bên trái trang login
   Không có logic backend, chỉ UI thuần
   ───────────────────────────────────────────────── */
export default function AuthLeft() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-12 relative overflow-hidden"
      style={{ background: "linear-gradient(145deg,#003DB3 0%,#0068FF 55%,#3D8EFF 100%)" }}
    >
      {/* Vòng trang trí */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full border border-white/10 pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <ChatIcon className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">BailoChat</span>
      </div>

      {/* Hero */}
      <div className="relative z-10">
        <p className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-4">
          Kết nối không giới hạn
        </p>
        <h1 className="text-4xl font-bold text-white leading-[1.2] mb-5">
          Trò chuyện mọi lúc,<br />mọi nơi
        </h1>
        <p className="text-white/60 text-sm leading-relaxed mb-10">
          Nhắn tin, gọi video và chia sẻ kỷ niệm với bạn bè,
          gia đình một cách dễ dàng và bảo mật.
        </p>

        {/* Feature pills */}
        <div className="space-y-3">
          {[
            { icon: "💬", label: "Nhắn tin tức thì" },
            { icon: "📹", label: "Gọi video chất lượng cao" },
            { icon: "👥", label: "Nhóm chat không giới hạn" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3"
            >
              <span className="text-lg">{f.icon}</span>
              <span className="text-white/90 text-sm font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="relative z-10 text-white/25 text-xs">© 2025 BailoChat</p>
    </div>
  );
}

const ChatIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V5z" />
  </svg>
);
