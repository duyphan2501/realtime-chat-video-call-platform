"use client";

import { useState } from "react";
import { usePresenceStore } from "@/store";
import { Conversation, User } from "@/types";
import { fmtTime } from "@/utils/chat.utils";
import { getAvatar } from "@/utils/user.utils";
import { SquarePen, UserPen, UserPlus } from "lucide-react";
import EditGroupModal from "../EditGroupModal";
import AddMembersModal from "../AddMembersModal";
import { useFriendService } from "@/services";

interface GroupHeaderProps {
  conversation: Conversation;
  isAdmin: boolean;
  onViewProfile: (user: User) => void;
}

const QUICK_ACTIONS = {
  group: [
    { icon: <UserPlus size={20} />, label: "Add", requireAdmin: false },
    { icon: <SquarePen size={20} />, label: "Edit", requireAdmin: true },
  ],
  direct: [
    { icon: <UserPen size={20} />, label: "Profile", requireAdmin: false },
  ],
};

export default function GroupHeader({
  conversation,
  isAdmin,
  onViewProfile,
}: GroupHeaderProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const isGroup = conversation.type === "group";
  const otherUser = isGroup ? undefined : conversation.otherUser;
  const isOnline = usePresenceStore((s) => s.isOnline);
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);
  const { getProfile } = useFriendService();

  const handleViewProfile = async (userId: string) => {
    try {
      const user = await getProfile(userId);
      console.log("Fetched user profile:", user);
      onViewProfile(user);
    } catch (error) {}
  };

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
            backgroundImage: `url("${getAvatar({
              name: isGroup
                ? conversation.name || "Unnamed Group"
                : otherUser?.name || "Unknown User",
              avatar: isGroup ? conversation.avatar : otherUser?.avatar,
            })}")`,
          }}
        />
      </div>

      <h3 className="text-xl font-bold text-white text-center">
        {isGroup ? conversation.name : otherUser?.name}
      </h3>
      {isGroup && (
        <p className="text-primary text-sm font-semibold mt-1">
          {conversation.participants?.length || 0} Members
        </p>
      )}
      {isGroup ? (
        conversation.name && ( // Assuming description is part of conversation name for now
          <p className=" text-[#9d9db9] text-sm text-center mt-3 px-4 leading-relaxed">
            {/* {conversation.name} description placeholder. */}
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
        {QUICK_ACTIONS[isGroup ? "group" : "direct"].map(
          ({ icon, label, requireAdmin }) => {
            if (isGroup && !isAdmin && requireAdmin) return null;
            const handleClick = () => {
              if (isGroup) {
                if (label === "Add") setShowAddModal(true);
                if (label === "Edit") setShowEditModal(true);
              } else if (label === "Profile") {
                  handleViewProfile(otherUser?._id || "");
              }
            };
            return (
              <button
                key={label}
                aria-label={label}
                onClick={handleClick}
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
            );
          },
        )}
      </div>

      {showEditModal && (
        <EditGroupModal
          conversation={conversation}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showAddModal && (
        <AddMembersModal
          conversation={conversation}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
