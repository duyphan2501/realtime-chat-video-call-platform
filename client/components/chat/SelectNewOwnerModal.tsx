"use client";

import { useState } from "react";
import { Conversation, User } from "@/types";
import { X, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { getAvatar, getUserName, isValidUser } from "@/utils/user.utils";

interface SelectNewOwnerModalProps {
  isOpen: boolean;
  conversation: Conversation;
  currentUserId: string;
  onConfirm: (newOwnerId: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function SelectNewOwnerModal({
  isOpen,
  conversation,
  currentUserId,
  onConfirm,
  onCancel,
  isLoading = false,
}: SelectNewOwnerModalProps) {
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>("");

  // Filter members: exclude current user and include only regular members and admins
  const eligibleOwners = (conversation.participants ?? []).filter(
    (p) => isValidUser(p.user) && p.user._id !== currentUserId && p.role !== "owner",
  );

  const handleConfirm = async () => {
    if (!selectedOwnerId) {
      toast.error("Please select a new owner");
      return;
    }

    try {
      await onConfirm(selectedOwnerId);
      setSelectedOwnerId("");
    } catch (error) {
      // Error is handled by the service
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-md rounded-[2.5rem] bg-surface border border-white/5 shadow-2xl pointer-events-auto overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/10">
            <h3 className="font-bold text-xl text-white">Select New Owner</h3>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {eligibleOwners.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-slate-400 text-sm">
                  No eligible members to promote as owner
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-2">
                  Group Members
                </p>
                <div className="max-h-80 overflow-y-auto custom-scrollbar space-y-2">
                  {eligibleOwners.map((participant) => {
                    const user = participant.user;
                    const userName = getUserName(user);
                    return (
                      <button
                        key={user._id}
                        onClick={() => setSelectedOwnerId(user._id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          selectedOwnerId === user._id
                            ? "bg-primary/20 border border-primary"
                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {/* Avatar */}
                        <img
                          src={getAvatar(user)}
                          alt={userName}
                          className="w-10 h-10 rounded-full object-cover"
                        />

                        {/* User Info */}
                        <div className="flex-1 text-left">
                          <p className="text-sm font-semibold text-white">
                            {userName}
                          </p>
                          <p className="text-xs text-slate-400 capitalize">
                            {participant.role}
                          </p>
                        </div>

                        {/* Selection Indicator */}
                        {selectedOwnerId === user._id && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <ChevronRight size={14} className="text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-8 py-6 border-t border-white/10 bg-[#0f0f18]">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-white/5 text-slate-300 hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !selectedOwnerId}
              className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {isLoading ? "Transferring..." : "Transfer Ownership"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
