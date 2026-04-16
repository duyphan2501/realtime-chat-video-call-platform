"use client";
import type { User } from "@/types";
import { usePresenceStore } from "@/store";
import { MessageSquare, Phone, Video, UserMinus, Calendar } from "lucide-react";

interface ContactDetailProps {
  contact: User;
  isFriend: boolean;
  onStartChat: (userId: string) => void;
  onUnfriend: (userId: string) => void;
}

export default function ContactDetail({
  contact,
  isFriend,
  onStartChat,
  onUnfriend,
}: ContactDetailProps) {
  const isOnline = usePresenceStore((s) => s.isOnline);
  const online = isOnline(contact._id);

  const avatarUrl =
    contact.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=e3e8f0&color=0068FF&bold=true&size=96`;

  return (
    <aside className="hidden xl:flex w-80 flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101022] overflow-y-auto">
      {/* ── Cover + Avatar ── */}
      <div className="h-40 w-full bg-gradient-to-br from-primary to-indigo-900 relative">
        <div className="absolute -bottom-10 left-6">
          <div className="h-24 w-24 rounded-2xl border-4 border-white dark:border-[#101022] bg-cover bg-center shadow-lg overflow-hidden">
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
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {contact.name}
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          @{contact.email?.split("@")[0] || contact.name.toLowerCase().replace(/\s+/g, "")}
        </p>

        <div className="space-y-6">
          {/* Status Message */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Status Message
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300">
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
              <p className="text-sm text-slate-700 dark:text-slate-300">
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
                  <p className="text-xs text-slate-500 w-16">Email:</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                    {contact.email}
                  </p>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-500 w-16">Phone:</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {contact.phone}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        {isFriend && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {/* Chat */}
            <button
              onClick={() => onStartChat(contact._id)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-blue-600 transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              Send Message
            </button>

            {/* Call & Video */}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Phone className="w-4 h-4" />
                Call
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <Video className="w-4 h-4" />
                Video
              </button>
            </div>

            {/* Unfriend */}
            <button
              onClick={() => {
                if (confirm(`Unfriend ${contact.name}?`)) {
                  onUnfriend(contact._id);
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <UserMinus className="w-5 h-5" />
              Unfriend
            </button>
          </div>
        )}

        {/* Not friend - Add Friend button */}
        {!isFriend && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-blue-600 transition-colors">
              <UserMinus className="w-4 h-4 rotate-[-90deg]" />
              Add Friend
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
