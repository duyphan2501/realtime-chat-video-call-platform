"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageSquare,
  Users,
  Cloud,
  Folder,
  CheckSquare,
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
    <aside className="flex flex-col items-center py-3 gap-2 shrink-0 h-100vh w-18 border-r border-gray-800 justify-center!">
      {/* Avatar */}
      <div className="relative mb-3 mt-1 cursor-pointer group">
        <img
          src={getAvatar({
            avatar: currentUser?.avatar,
            name: currentUser?.name ?? "",
          })}
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
        className={`w-12 h-12 text-gray-400 flex items-center justify-center rounded-2xl transition-all duration-150 cursor-pointer hover:bg-primary/10 ${active && "text-primary bg-primary/10"}`}
      >
        {children}
      </div>
    </div>
  );
}
