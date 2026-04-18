"use client";
import type { User } from "@/types";
import { usePresenceStore } from "@/store";
import { MessageSquare, Phone, MoreVertical } from "lucide-react";
import { useState } from "react";

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
  const online = isOnline(user._id);
  const [showMenu, setShowMenu] = useState(false);

  const avatarUrl =
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e3e8f0&color=0068FF&bold=true&size=48`;

  return (
    <div
      className={`group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
        selected
          ? "bg-slate-100 dark:bg-slate-800/50"
          : "hover:bg-slate-50 dark:hover:bg-white/[0.03]"
      } ${!online ? "grayscale opacity-60" : ""}`}
      onClick={onClick}
    >
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <img
            src={avatarUrl}
            alt={user.name}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-[#0b0b18] ${
              online ? "bg-green-500" : "bg-slate-400"
            }`}
          />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-slate-900 dark:text-white">
              {user.name}
            </span>
            {user.email && (
              <span className="text-xs text-slate-500">
                @{user.email.split("@")[0]}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {online ? "Active now" : "Offline"}
          </p>
        </div>
      </div>

      {/* Right: Action buttons (show on hover) */}
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartChat(user._id);
          }}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary transition-colors"
          title="Chat"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // TODO: Implement call
          }}
          className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary transition-colors"
          title="Call"
        >
          <Phone className="w-4 h-4" />
        </button>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10">
              <button className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                View Profile
              </button>
              <button className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700">
                Block User
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
