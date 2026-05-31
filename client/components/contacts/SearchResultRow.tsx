"use client";
import type { User } from "@/types";
import { getAvatar, getUserName } from "@/utils/user.utils";
import { UserPlus, UserCheck, Clock } from "lucide-react";

interface SearchResultRowProps {
  user: User;
  isFriend: boolean;
  isSent: boolean;
  selected?: boolean;
  onClick: () => void;
  onAddFriend: () => void;
  isLoading?: boolean;
}

export default function SearchResultRow({
  user,
  isFriend,
  isSent,
  selected = false,
  onClick,
  onAddFriend,
  isLoading = false,
}: SearchResultRowProps) {
  const avatarUrl = getAvatar(user);
  const displayName = getUserName(user);

  return (
    <div
      onClick={onClick}
      className={`group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer ${
        selected ? "bg-slate-800/50" : "hover:bg-white/3"
      }`}
    >
      {/* Left: Avatar + Info */}
      <div className="flex items-center gap-3">
        <img
          src={avatarUrl}
          alt={displayName}
          className="h-10 w-10 rounded-full object-cover shrink-0"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-white">
            {displayName}
          </span>
          <span className="text-xs text-slate-500">{user.email || ""}</span>
        </div>
      </div>

      {/* Right: Status/Action */}
      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        {isFriend ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400">
            <UserCheck className="w-3.5 h-3.5" />
            Friends
          </span>
        ) : isSent || isLoading ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            Sent
          </span>
        ) : (
          <button
            onClick={onAddFriend}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary hover:bg-blue-600 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Friend
          </button>
        )}
      </div>
    </div>
  );
}
