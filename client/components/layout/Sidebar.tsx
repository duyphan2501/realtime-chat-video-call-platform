"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Users,
  Cloud,
  Folder,
  CheckSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store";

const NAV_ITEMS = [
  {
    href: "/chat",
    label: "Tin nhắn",
    Icon: MessageSquare,
  },
  {
    href: "/contacts",
    label: "Danh bạ",
    Icon: Users,
  },
  {
    href: "/cloud",
    label: "Cloud",
    Icon: Cloud,
  },
  {
    href: "/files",
    label: "File",
    Icon: Folder,
  },
  {
    href: "/tasks",
    label: "Công việc",
    Icon: CheckSquare,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const currentUser = useAuthStore((s) => s.user);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/auth";
  };

  return (
    <aside className="flex flex-col items-center py-3 gap-2 shrink-0 h-100vh w-18 border-r border-gray-800 justify-center!">
      {/* Avatar */}
      <div className="relative mb-3 mt-1 cursor-pointer group">
        <img
          src={
            currentUser?.avatar ||
            `https://ui-avatars.com/api/?name=U&background=fff&color=0068FF&bold=true&size=40`
          }
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover ring-2 ring-white/25"
        />

        <span
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
          style={{
            background: "var(--color-online)",
            borderColor: "#0057D9",
          }}
        />
      </div>

      {/* Nav */}
      {NAV_ITEMS.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);

        return (
          <NavLink key={href} href={href} title={label} active={active}>
            <Icon className="w-5 h-5" />
          </NavLink>
        );
      })}

      <div className="flex-1" />

      {/* Settings */}
      <NavLink
        href="/settings"
        title="Cài đặt"
        active={pathname === "/settings"}
      >
        <Settings className="w-5 h-5" />
      </NavLink>

      {/* Logout */}
      <button onClick={logout}>
        <NavBtn title="Đăng xuất">
          <LogOut className="w-5 h-5" />
        </NavBtn>
      </button>
    </aside>
  );
}

function NavLink({
  href,
  children,
  title,
  active,
}: {
  href: string;
  children: React.ReactNode;
  title: string;
  active: boolean;
}) {
  return (
    <Link href={href}>
      <NavBtn title={title} active={active}>
        {children}
      </NavBtn>
    </Link>
  );
}

function NavBtn({
  children,
  title,
  active = false,
}: {
  children: React.ReactNode;
  title: string;
  active?: boolean;
}) {
  return (
    <div className="relative">
      <div
        title={title}
        className={`w-12 h-12 text-gray-400 flex items-center justify-center rounded-2xl transition-all duration-150 cursor-pointer hover:bg-primary/10 ${active && "text-primary bg-primary/10"}`}
      >
        {children}
      </div>
    </div>
  );
}
