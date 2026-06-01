"use client";

import { useState } from "react";
import { useConversationStore } from "@/store/conversation.store";
import { useShallow } from "zustand/react/shallow";
import {
  Info,
  X,
  LogOut,
  AlertTriangle,
  ChevronRight,
  Trash2,
} from "lucide-react";
import GroupHeader from "./GroupHeader";
import MembersAccordion from "./MembersAccordion";
import SharedMediaAccordion from "./SharedMediaAccordion";
import DocumentsAccordion from "./DocumentsAccordion";
import { useConversationService } from "@/services";
import { useAuthStore } from "@/store";
import { useRouter } from "next/navigation";
import ConfirmModal from "../../ConfirmModal";
import SelectNewOwnerModal from "../SelectNewOwnerModal";
import { User } from "@/types";
import ProfileModal from "@/components/layout/ProfileModal";

interface Props {
  conversationId: string;
  onClose: () => void;
}

export default function RightPanel({ conversationId, onClose }: Props) {
  const router = useRouter();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [showSelectOwner, setShowSelectOwner] = useState(false);
  const {
    leaveGroup,
    disbandGroup,
    removeConversation,
    isLeavingGroup,
    isDisbandingGroup,
    isRemovingConversation,
  } = useConversationService();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Tối ưu selector: chỉ lấy đúng conversation cần thiết
  const conversation = useConversationStore(
    useShallow((state) => state.conversations.get(conversationId)),
  );

  const isGroup = conversation?.type === "group";
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin =
    conversation?.participants?.some(
      (p) =>
        p.user?._id === currentUser?._id &&
        (p.role === "admin" || p.role === "owner"),
    ) || false;
  const isOwner =
    conversation?.participants?.some(
      (p) => p.user?._id === currentUser?._id && p.role === "owner",
    ) || false;

  const handleLeaveGroupClick = () => {
    if (isOwner) {
      // If user is the owner, show selection modal first
      setShowSelectOwner(true);
    } else {
      // Regular member can leave directly
      setShowLeaveConfirm(true);
    }
  };

  const handleLeaveGroupWithNewOwner = async (newOwnerId: string) => {
    if (!conversation) return;
    try {
      await leaveGroup({ conversationId: conversation._id, newOwnerId });
      router.push("/");
      onClose();
      setShowSelectOwner(false);
    } catch {
      // Error handled by service
    }
  };

  const handleLeaveGroup = async () => {
    if (!conversation) return;
    try {
      await leaveGroup({ conversationId: conversation._id });
      router.push("/");
      onClose();
    } catch {
      // Error handled by service
    } finally {
      setShowLeaveConfirm(false);
    }
  };

  const handleDisbandGroup = async () => {
    if (!conversation) return;
    try {
      await disbandGroup(conversation._id);
      router.push("/");
      onClose();
    } catch {
      // Error handled by service
    } finally {
      setShowDisbandConfirm(false);
    }
  };

  const handleRemoveConversation = async () => {
    if (!conversation) return;
    try {
      await removeConversation(conversation._id);
      router.push("/");
      onClose();
    } catch {
      // Error handled by service
    } finally {
      setShowRemoveConfirm(false);
    }
  };

  if (!conversation) return null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-l border-gray bg-[#0f0f18] text-slate-200 shadow-2xl">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray px-6 py-4 bg-[#111118] shrink-0">
        <div className="flex items-center gap-3">
          <Info className="w-5 h-5 text-[#9d9db9]" />
          <h2 className="text-base font-bold tracking-tight text-white">
            {isGroup ? "Group Info" : "Contact Info"}
          </h2>
        </div>

        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-lg h-8 w-8 border-gray hover:bg-primary/20 hover:text-white transition-all text-slate-400 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="bg-[#111118]/50">
          <GroupHeader
            conversation={conversation}
            isAdmin={isAdmin}
            onViewProfile={setSelectedUser}
          />
        </div>

        <div className="flex flex-col divide-y divide-gray">
          <MembersAccordion
            conversation={conversation}
            isAdmin={isAdmin || isOwner}
            onViewProfile={(user) => {
              setSelectedUser(user);
            }}
          />
          <SharedMediaAccordion conversationId={conversation._id} />
          <DocumentsAccordion conversationId={conversation._id} />
        </div>

        {/* Danger Zone */}
        <div className="px-6 py-4 space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2 mb-1">
            Danger Zone
          </p>

          {isGroup && (
            <>
              {isOwner && (
                <button
                  onClick={() => setShowDisbandConfirm(true)}
                  disabled={isDisbandingGroup}
                  className="w-full flex items-center justify-between px-5 py-4 bg-red-500/5 border border-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all duration-300 group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3 font-bold text-sm">
                    <AlertTriangle size={18} />
                    {isDisbandingGroup ? "Disbanding..." : "Disband Group"}
                  </div>
                  <ChevronRight
                    size={16}
                    className="opacity-50 group-hover:translate-x-1 transition-transform"
                  />
                </button>
              )}

              <button
                onClick={handleLeaveGroupClick}
                disabled={isLeavingGroup}
                className="w-full flex items-center justify-between px-5 py-4 bg-white/5 border border-white/5 text-slate-300 rounded-2xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 group disabled:opacity-50"
              >
                <div className="flex items-center gap-3 font-bold text-sm">
                  <LogOut size={18} />
                  {isLeavingGroup ? "Leaving..." : "Leave Group"}
                </div>
                <ChevronRight
                  size={16}
                  className="opacity-50 group-hover:translate-x-1 transition-transform"
                />
              </button>
            </>
          )}

          <button
            onClick={() => setShowRemoveConfirm(true)}
            disabled={isRemovingConversation}
            className="w-full flex items-center justify-between px-5 py-4 bg-white/5 border border-white/5 text-slate-300 rounded-2xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 group disabled:opacity-50"
          >
            <div className="flex items-center gap-3 font-bold text-sm">
              <Trash2 size={18} />
              {isRemovingConversation ? "Removing..." : "Remove Conversation"}
            </div>
            <ChevronRight
              size={16}
              className="opacity-50 group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 border-t border-gray text-center bg-[#0b0b14] shrink-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium">
          Created May 2023
        </p>
      </footer>

      <ConfirmModal
        isOpen={showLeaveConfirm}
        title="Leave Group"
        message="Are you sure you want to leave this group?"
        onConfirm={handleLeaveGroup}
        onCancel={() => setShowLeaveConfirm(false)}
        confirmText="Leave"
        cancelText="Cancel"
      />

      <SelectNewOwnerModal
        isOpen={showSelectOwner}
        conversation={conversation!}
        currentUserId={currentUser?._id || ""}
        onConfirm={handleLeaveGroupWithNewOwner}
        onCancel={() => setShowSelectOwner(false)}
        isLoading={isLeavingGroup}
      />

      <ConfirmModal
        isOpen={showDisbandConfirm}
        title="Disband Group"
        message="Are you sure you want to disband this group? This action cannot be undone."
        onConfirm={handleDisbandGroup}
        onCancel={() => setShowDisbandConfirm(false)}
        confirmText="Disband"
        cancelText="Cancel"
      />

      <ConfirmModal
        isOpen={showRemoveConfirm}
        title="Remove Conversation"
        message="This conversation will be removed from your inbox and existing messages will be hidden for you."
        onConfirm={handleRemoveConversation}
        onCancel={() => setShowRemoveConfirm(false)}
        confirmText={isRemovingConversation ? "Removing..." : "Remove"}
        cancelText="Cancel"
        variant="danger"
      />

      {selectedUser && (
        <ProfileModal
          user={selectedUser}
          isEditable={selectedUser._id === currentUser?._id}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
