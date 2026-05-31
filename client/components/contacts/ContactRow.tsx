"use client";
import type { User } from "@/types";
import { usePresenceStore } from "@/store";
import { MessageSquare, Phone, MoreVertical } from "lucide-react";
import { useState } from "react";
import { getAvatar, getUserName } from "@/utils/user.utils";

interface ContactRowProps {
  user: User;
  selected?: boolean;
  onClick: () => void;
  onStartChat: (userId: string) => void;
}

export default function ContactRow({
  user,
  selected = false,
  onClick,
  onStartChat,
}: ContactRowProps) {
  const isOnline = usePresenceStore((s) => s.isOnline);
  const online = isOnline(user?._id || "");
  const [showMenu, setShowMenu] = useState(false);

  const displayName = getUserName(user);
  const avatarUrl = getAvatar(user);

  return (
    <div
      className={`group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
        selected ? "bg-slate-800/50" : "hover:bg-white/3"
      } ${!online ? "grayscale opacity-60" : ""}`}
      onClick={onClick}
    >
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[#0b0b18] ${
              online ? "bg-green-500" : "bg-slate-400"
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-white">
              {displayName}
            </span>
            {user?.email && (
              <span className="text-xs text-slate-300">
                @{user.email.split("@")[0]}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300">
            {online ? "Active now" : "Offline"}
          </p>
        </div>
      </div>

      {/* Right: Action buttons (show on hover) */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (user?._id) onStartChat(user._id);
          }}
          className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-primary transition-colors"
          title="Chat"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
