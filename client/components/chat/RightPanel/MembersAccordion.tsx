"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Accordion from "./Accordion";
import { Conversation, Participant, User } from "@/types";
import { Ellipsis, Search, Users } from "lucide-react";
import { getAvatar, getUserName, isValidUser } from "@/utils/user.utils";
import { useAuthStore, useConversationStore } from "@/store";
import { useConversationService } from "@/services";
import ProfileModal from "../../layout/ProfileModal";
import ConfirmModal from "../../ConfirmModal";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import { userAPI } from "@/API/user.api";
import { conversationAPI } from "@/API/conversation.api";
import toast from "react-hot-toast";

interface MembersAccordionProps {
  conversation: Conversation;
  isAdmin: boolean;
  onViewProfile: (user: User) => void;
}

const ROLE_BADGE: Record<
  Participant["role"],
  { label: string; className: string } | null
> = {
  owner: { label: "Owner", className: "bg-primary/10 text-primary" },
  admin: { label: "Admin", className: "bg-amber-500/10 text-amber-500" },
  member: null,
};

export default function MembersAccordion({
  conversation,
  isAdmin,
  onViewProfile,
}: MembersAccordionProps) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const setActiveId = useConversationStore((s) => s.setActiveId);
  const [query, setQuery] = useState("");
  const [showActions, setShowActions] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<{
    userId: string;
    action: string;
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    userId: string;
  }>({ isOpen: false, userId: "" });
  const axiosPrivate = useAxiosPrivate();

  const { createConversation, removeMember } = useConversationService();

  const handleViewProfile = async (user: User) => {
    try {
      const api = userAPI(axiosPrivate);
      const res = await api.getProfile(user._id);
      onViewProfile(res.data.user);
      setShowActions(null);
    } catch (error) {
      toast.error("Failed to fetch user profile");
    }
  };

  const handleSendMessage = async (userId: string) => {
    try {
      setLoadingAction({ userId, action: "message" });
      const api = conversationAPI(axiosPrivate);
      const res = await api.createConversation({
        participantIds: [userId],
        type: "direct",
      });
      const convId = res.data?.conversation?._id ?? res.data?._id;
      if (convId) {
        setActiveId(convId);
        router.push("/");
      }
    } catch (error) {
      toast.error("Failed to create conversation");
    } finally {
      setLoadingAction(null);
      setShowActions(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      setLoadingAction({ userId, action: "remove" });
      await removeMember({ conversationId: conversation._id, userId });
    } catch (error) {
      toast.error("Failed to remove member");
    } finally {
      setLoadingAction(null);
      setShowActions(null);
      setConfirmDialog({ isOpen: false, userId: "" });
    }
  };

  // 1. Filter actions based on isAdmin prop
  const actions = useMemo(() => {
    const list = [
      {
        label: "View Profile",
        onClick: (userId: string) => {
          const user = (conversation.participants ?? []).find(
            (p) => p.user?._id === userId,
          )?.user;
          if (user) handleViewProfile(user);
        },
        requireAdmin: false,
      },
      {
        label: "Send Message",
        onClick: (userId: string) => handleSendMessage(userId),
        requireAdmin: false,
      },
      {
        label: "Remove from Group",
        onClick: (userId: string) => {
          setConfirmDialog({ isOpen: true, userId });
        },
        requireAdmin: true,
      },
    ];
    return list.filter((action) => !action.requireAdmin || isAdmin);
  }, [conversation, currentUser, isAdmin]);

  const validParticipants = useMemo(
    () =>
      (conversation.participants ?? []).filter(
        (participant) => participant && isValidUser(participant.user),
      ),
    [conversation.participants],
  );

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return validParticipants.filter((p) =>
      getUserName(p.user).toLowerCase().includes(normalizedQuery),
    );
  }, [validParticipants, query]);

  const handleToggleActions = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShowActions(showActions === id ? null : id);
  };

  useEffect(() => {
    const handleClose = () => setShowActions(null);
    window.addEventListener("click", handleClose);
    return () => window.removeEventListener("click", handleClose);
  }, []);

  if (conversation.type === "direct") return null;

  const isLoading = (userId: string) => loadingAction?.userId === userId;

  return (
    <>
      <Accordion
        icon={<Users />}
        title={`Members (${validParticipants.length})`}
        defaultOpen
      >
        <div className="px-4 pb-4">
          <div className="px-2 py-2 mb-2">
            <label className="flex items-center bg-gray rounded-lg h-10 px-3 gap-2 border border-transparent focus-within:border-primary/50 transition-all">
              <Search className="text-slate-400 w-4 h-4" />
              <input
                className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-500 outline-none"
                placeholder="Find a member..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-col gap-1">
            {filteredMembers.map((participant) => {
              const badge = ROLE_BADGE[participant.role];
              const user = participant.user;
              const userName = getUserName(user);
              const isMe = user._id === currentUser?._id;

              return (
                <div
                  key={user._id}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#1c1c2d] transition-colors group/item"
                >
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-10 w-10 shadow-sm"
                    style={{
                      backgroundImage: `url("${getAvatar(user)}")`,
                    }}
                  />

                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {userName}{" "}
                        {isMe && <span className="text-slate-500">(You)</span>}
                      </p>
                      {badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Hide Ellipsis if it's the current user */}
                  {!isMe && (
                    <div className="relative">
                      <button
                        className="text-slate-300 p-1 rounded-full hover:bg-gray active:bg-gray/80 transition-all"
                        onClick={(e) =>
                          handleToggleActions(e, user._id)
                        }
                      >
                        <Ellipsis size={20} />
                      </button>

                      {showActions === user._id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-[#252539] border border-white/5 rounded-lg shadow-xl py-1 z-50 overflow-hidden">
                          {actions.map((action) => (
                            <button
                              key={action.label}
                              disabled={isLoading(user._id)}
                              onClick={() =>
                                action.onClick(user._id)
                              }
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/20 transition-colors disabled:opacity-50"
                            >
                              {isLoading(user._id)
                                ? "Processing..."
                                : action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Accordion>

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title="Remove Member"
        message="Are you sure you want to remove this member?"
        onConfirm={() => handleRemoveMember(confirmDialog.userId)}
        onCancel={() => setConfirmDialog({ isOpen: false, userId: "" })}
        confirmText="Remove"
        cancelText="Cancel"
      />
    </>
  );
}
