"use client";

import { usePresenceStore } from "@/store";
import { Conversation, User } from "@/types";
import { fmtTime } from "@/utils/chat.utils";
import { Search, Settings, SquarePen, UserPen, UserPlus } from "lucide-react";

interface GroupHeaderProps {
  conversation: Conversation;
}

const QUICK_ACTIONS = {
  group: [
    { icon: <UserPlus size={20} />, label: "Add" },
    { icon: <Search size={20} />, label: "Search" },
    { icon: <Settings size={20} />, label: "Manage" },
  ],
  direct: [
    { icon: <UserPen size={20} />, label: "Profile" },
    { icon: <Search size={20} />, label: "Search" },
  ],
};

export default function GroupHeader({ conversation }: GroupHeaderProps) {
  const isGroup = conversation.type === "group";
  const otherUser = isGroup ? undefined : conversation.otherUser;
  const isOnline = usePresenceStore((s) => s.isOnline);
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  console.log(otherUser)
  return (
    <div className="flex flex-col items-center p-8 border-b  border-[#1c1c2d]">
      <div className="relative mb-4">
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-28 w-28 border-4  border-[#111118] bg-primary/10 shadow-lg"
          role="img"
          aria-label={`${
            isGroup ? conversation.name : otherUser?.name
          } group avatar`}
          style={{
            backgroundImage: `url("${
              isGroup ? conversation.avatar : otherUser?.avatar
            }")`,
          }}
        />
        {isGroup && (
          <button
            aria-label="Edit group photo"
            className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full shadow-lg hover:scale-105 transition-transform"
          >
            <span className="material-symbols-outlined text-xs cursor-pointer">
              <SquarePen size={15} />
            </span>
          </button>
        )}
      </div>

      <h3 className="text-xl font-bold text-white text-center">
        {isGroup ? conversation.name : otherUser?.name}
      </h3>
      {isGroup && (
        <p className="text-primary text-sm font-semibold mt-1">
          {conversation.participants.length} Members
        </p>
      )}
      {isGroup ? (
        conversation.name && ( // Assuming description is part of conversation name for now
          <p className=" text-[#9d9db9] text-sm text-center mt-3 px-4 leading-relaxed">
            {conversation.name} description placeholder.
          </p>
        )
      ) : isOnline(otherUser?._id || "") ? (
        <p className="text-green-500 text-sm mt-1 ">Online</p>
      ) : (
        <p className="text-xs text-slate-300 mt-1">
          Last active{" "}
          {fmtTime(
            onlineUsers[otherUser?._id || ""]?.lastActive ||
              otherUser?.lastActive,
          )}
        </p>
      )}

      <div className="flex gap-3 mt-4">
        {QUICK_ACTIONS[isGroup ? "group" : "direct"].map(({ icon, label }) => (
          <button
            key={label}
            aria-label={label}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-10 h-10 rounded-full  bg-gray flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined  text-slate-300">
                {icon}
              </span>
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
