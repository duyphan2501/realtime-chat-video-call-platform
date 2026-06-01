"use client";
import type { User } from "@/types";
import { getAvatar, getUserName } from "@/utils/user.utils";
import { Check, MessageSquare, X } from "lucide-react";

interface RequestCardProps {
  user: User;
  onAccept: () => void;
  onReject: () => void;
  onCancel: () => void;
  onClick: () => void;
  onStartChat: (userId: string) => void;
}

export default function RequestCard({
  user,
  onAccept,
  onReject,
  onCancel,
  onClick,
  onStartChat,
}: RequestCardProps) {
  const avatarUrl = getAvatar(user);
  const displayName = getUserName(user);
  const isSentRequest = user.friendStatus === "sent";
  return (
    <div
      className="rounded-xl p-3  cursor-pointer transition-colors bg-slate-800/30 hover:bg-slate-800/50 flex items-center justify-between"
      onClick={onClick}
    >
      <div className=" flex items-center gap-3">
        {/* Avatar */}
        <img
          src={avatarUrl}
          alt={displayName}
          className="h-12 w-12 rounded-full object-cover shrink-0"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-white truncate">
            {displayName}
          </p>
          <p className="text-xs text-slate-500 truncate">{user.email || ""}</p>

          {/* Action buttons */}
          <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
            {isSentRequest ? (
              // Nút Hủy nếu là yêu cầu mình gửi
              <button
                onClick={onCancel}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-colors"
              >
                Cancel Request
              </button>
            ) : (
              <>
                <button
                  onClick={onAccept}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-green-500 hover:bg-green-600 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Accept
                </button>
                <button
                  onClick={onReject}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Decline
                </button>
              </>
            )}
          </div>
        </div>
      </div>
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
  );
}
