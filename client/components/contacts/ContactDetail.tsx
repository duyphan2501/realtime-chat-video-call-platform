"use client";
import { useState } from "react";
import type { User } from "@/types";
import { usePresenceStore } from "@/store";
import {
  MessageSquare,
  Phone,
  Video,
  UserMinus,
  Calendar,
  X,
} from "lucide-react";
import { getAvatar } from "@/utils/user.utils";
import ConfirmModal from "../ConfirmModal";

interface ContactDetailProps {
  contact: User;
  isFriend: boolean;
  onStartChat: (userId: string) => void;
  onUnfriend: (userId: string) => void;
  onClose: () => void;
}

export default function ContactDetail({
  contact,
  isFriend,
  onStartChat,
  onUnfriend,
  onClose,
}: ContactDetailProps) {
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const isOnline = usePresenceStore((s) => s.isOnline);
  const online = isOnline(contact._id);

  const avatarUrl = getAvatar(contact);

  const handleUnfriendConfirm = () => {
    onUnfriend(contact._id);
    setShowUnfriendConfirm(false);
  };

  return (
    <aside
      className="fixed inset-0 z-50 flex flex-col w-full  bg-[#101022] md:overflow-hidden overflow-y-auto 
      md:relative md:z-0 md:w-80 md:border-l  md:border-slate-800"
    >
      <div className="absolute top-4 right-4 z-10 xl:hidden">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      {/* ── Cover + Avatar ── */}
      <div className="h-48 xl:h-40 w-full bg-linear-to-br from-primary to-indigo-900 relative shrink-0">
        <div className="absolute -bottom-10 left-6">
          <div className="h-24 w-24 rounded-2xl border-4  border-[#101022] bg-cover bg-center shadow-lg overflow-hidden">
            <img
              src={avatarUrl}
              alt={contact.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* ── Profile Info ── */}
      <div className="pt-14 px-6 pb-6">
        <h3 className="text-lg font-bold  text-white">{contact.name}</h3>
        <p className="text-sm text-slate-500 mb-6">
          @
          {contact.email?.split("@")[0] ||
            contact.name.toLowerCase().replace(/\s+/g, "")}
        </p>

        <div className="space-y-6">
          {/* Status Message */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Status Message
            </h4>
            <p className="text-sm  text-slate-300">
              {contact.bio || "No status message"}
            </p>
          </div>

          {/* Member Since */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Status
            </h4>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${online ? "bg-green-500" : "bg-slate-400"}`}
              />
              <p className="text-sm  text-slate-300">
                {online ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Contact Info
            </h4>
            <div className="space-y-2">
              {contact.email && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500 w-10">Email:</p>
                  <p className="text-sm  text-slate-300 truncate">
                    {contact.email}
                  </p>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500 w-10">Phone:</p>
                  <p className="text-sm  text-slate-300">{contact.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        {isFriend && (
          <div className="pt-4 border-t  border-slate-800 space-y-2">
            {/* Chat */}
            <button
              onClick={() => onStartChat(contact._id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-blue-600 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Send Message
            </button>

            <div className="flex-1"></div>

            {/* Unfriend */}
            <button
              onClick={() => setShowUnfriendConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 font-medium text-sm  hover:bg-red-500/10 transition-colors"
            >
              <UserMinus className="w-5 h-5" />
              Unfriend
            </button>
          </div>
        )}

        {/* Not friend - Add Friend button */}
        {!isFriend && (
          <div className="pt-4 border-t  border-slate-800">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-600 transition-colors">
              <UserMinus className="w-4 h-4 -rotate-90" />
              Add Friend
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showUnfriendConfirm}
        title="Unfriend"
        message={`Unfriend ${contact.name}?`}
        onConfirm={handleUnfriendConfirm}
        onCancel={() => setShowUnfriendConfirm(false)}
        confirmText="Unfriend"
        cancelText="Cancel"
      />
    </aside>
  );
}
