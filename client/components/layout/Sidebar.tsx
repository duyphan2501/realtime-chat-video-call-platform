"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Users,
  Settings,
} from "lucide-react";
import { useAuthStore } from "@/store";
import { getAvatar } from "@/utils/user.utils";
import { useState } from "react";
import SettingsPopover from "./SettingsPopover";
import ProfileModal from "./ProfileModal";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Messages",
    Icon: MessageSquare,
  },
  {
    href: "/contacts",
    label: "Contacts",
    Icon: Users,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const currentUser = useAuthStore((s) => s.user);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <aside className="flex h-dvh w-14 shrink-0 flex-col items-center justify-center! gap-2 border-r border-gray-800 py-3 sm:w-18">
      {/* Avatar */}
      <div className="relative mb-3 mt-1 cursor-pointer group">
        <img
          src={getAvatar({
            avatar: currentUser?.avatar,
            name: currentUser?.name ?? "",
          })}
          alt="avatar"
          className="h-9 w-9 rounded-full object-cover ring-2 ring-white/25 sm:h-10 sm:w-10"
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
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);

        return (
          <NavLink key={href} href={href} title={label} active={active}>
            <Icon className="w-5 h-5" />
          </NavLink>
        );
      })}

      <div className="flex-1" />

      {/* Settings */}
      <div className="relative">
        <NavBtn
          title="Cài đặt"
          onClick={() => setShowSettingsPopover((v) => !v)}
        >
          <Settings className="w-5 h-5" />
        </NavBtn>
        {showSettingsPopover && (
          <SettingsPopover
            onClose={() => setShowSettingsPopover(false)}
            onViewProfile={() => {
              setShowSettingsPopover(false);
              setShowProfileModal(true);
            }}
          />
        )}
      </div>

      {showProfileModal && (
        <ProfileModal onClose={() => setShowProfileModal(false)} />
      )}
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
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="relative" onClick={onClick}>
      <div
        title={title}
        className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl text-gray-400 transition-all duration-150 hover:bg-primary/10 sm:h-12 sm:w-12 ${active && "text-primary bg-primary/10"}`}
      >
        {children}
      </div>
    </div>
  );
}
