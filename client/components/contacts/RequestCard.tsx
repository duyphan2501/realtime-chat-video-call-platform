"use client";
import type { User } from "@/types";
import { Check, X } from "lucide-react";

interface RequestCardProps {
  user: User;
  onAccept: () => void;
  onReject: () => void;
  onClick: () => void;
}

export default function RequestCard({
  user,
  onAccept,
  onReject,
  onClick,
}: RequestCardProps) {
  const avatarUrl =
    user.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e3e8f0&color=0068FF&bold=true&size=48`;

  return (
    <div
      className="rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-colors bg-slate-100/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50"
      onClick={onClick}
    >
      {/* Avatar */}
      <img
        src={avatarUrl}
        alt={user.name}
        className="h-12 w-12 rounded-full object-cover shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
          {user.name}
        </p>
        <p className="text-xs text-slate-500 truncate">{user.email}</p>

        {/* Action buttons */}
        <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onAccept}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors"
          >
            <Check className="w-3 h-3" />
            Accept
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            <X className="w-3 h-3" />
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
