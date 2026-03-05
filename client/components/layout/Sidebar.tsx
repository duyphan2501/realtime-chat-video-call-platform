/* ═══════════════════════════════════════════════════════════
   components/layout/Sidebar.tsx
   Sidebar dọc 68px — icon nav + avatar user

   TODO — backend:
   ① currentUser từ /users/me (đã load ở page.tsx)
   ② badge số lượng friend requests từ store
   ③ logout gọi authApi.logout() rồi clear localStorage
   ═══════════════════════════════════════════════════════════ */
"use client";
import type { User } from "@/types";

export type Tab = "chat" | "contacts" | "cloud" | "files" | "tasks";

const NAV_ITEMS: { id: Tab; label: string; Icon: React.FC<{ className: string }> }[] = [
  {
    id: "chat", label: "Tin nhắn",
    Icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v7a2 2 0 01-2 2H9l-4 3v-3H4a2 2 0 01-2-2V5z"/></svg>,
  },
  {
    id: "contacts", label: "Danh bạ",
    Icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0zM2 16a6 6 0 0112 0H2zm8 0a6 6 0 0112 0H10z"/></svg>,
  },
  {
    id: "cloud", label: "Cloud",
    Icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z"/></svg>,
  },
  {
    id: "files", label: "File",
    Icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H2V6zm0 3h16v6a2 2 0 01-2 2H4a2 2 0 01-2-2V9z" clipRule="evenodd"/></svg>,
  },
  {
    id: "tasks", label: "Công việc",
    Icon: ({ className }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>,
  },
];

interface Props {
  activeTab:        Tab;
  onTabChange:      (t: Tab) => void;
  currentUser:      User | null;
  friendReqCount?:  number;
}

export default function Sidebar({ activeTab, onTabChange, currentUser, friendReqCount = 0 }: Props) {
  // TODO ③: gọi authApi.logout() trước khi redirect
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/auth";
  };

  return (
    <aside
      className="flex flex-col items-center py-3 gap-0.5 shrink-0"
      style={{
        width: 68,
        height: "100vh",
        background: "#0057D9",
        boxShadow: "var(--shadow-sidebar)",
      }}
    >
      {/* Avatar — TODO ①: avatar từ currentUser */}
      <div className="relative mb-3 mt-1 cursor-pointer group">
        <img
          src={
            currentUser?.avatar ||
            `https://ui-avatars.com/api/?name=U&background=fff&color=0068FF&bold=true&size=40`
          }
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover transition-all ring-2 ring-white ring-opacity-25"
        />
        {/* Online dot */}
        <span
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
          style={{ background: "var(--color-online)", borderColor: "#0057D9" }}
        />
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map(({ id, label, Icon }) => (
        <NavBtn
          key={id}
          title={label}
          active={activeTab === id}
          badge={id === "contacts" && friendReqCount > 0 ? friendReqCount : 0}
          onClick={() => onTabChange(id)}
        >
          <Icon className="w-5 h-5" />
        </NavBtn>
      ))}

      <div className="flex-1" />

      {/* Settings */}
      <NavBtn title="Cài đặt" active={false} onClick={() => {}}>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
        </svg>
      </NavBtn>

      {/* Logout */}
      <NavBtn title="Đăng xuất" active={false} onClick={logout}>
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
        </svg>
      </NavBtn>
    </aside>
  );
}

function NavBtn({
  children, title, active, onClick, badge = 0,
}: {
  children: React.ReactNode;
  title: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <div className="relative">
      <button
        title={title}
        onClick={onClick}
        className="w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-150"
        style={{
          background: active ? "rgba(255,255,255,.18)" : "transparent",
          color: active ? "white" : "rgba(255,255,255,.55)",
        }}
        onMouseEnter={(e) => {
          if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,.1)";
          (e.currentTarget as HTMLElement).style.color = "white";
        }}
        onMouseLeave={(e) => {
          if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
          if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,.55)";
        }}
      >
        {children}
      </button>
      {badge > 0 && (
        <span
          className="absolute top-0.5 right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-white font-bold px-1"
          style={{ background: "var(--color-danger)", fontSize: 9 }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </div>
  );
}
