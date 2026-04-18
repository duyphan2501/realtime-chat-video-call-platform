"use client";
import { useState, useCallback } from "react";
import type { User } from "@/types";
import { useAuthStore, useConversationStore, useFriendStore } from "@/store";
import { useFriendService } from "@/services";
import { useRouter } from "next/navigation";
import { conversationAPI } from "@/API/conversation.api";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import toast from "react-hot-toast";
import { UserPlus, Users } from "lucide-react";

import ContactList from "./ContactList";
import ContactDetail from "./ContactDetail";
import AddFriendModal from "./AddFriendModal";

export default function ContactsPage() {
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const friends = useFriendStore((s) => s.friends);
  const friendRequests = useFriendStore((s) => s.friendRequests);
  const { unfriend } = useFriendService();
  const setActiveId = useConversationStore((s) => s.setActiveId);
  const router = useRouter();
  const axiosPrivate = useAxiosPrivate();

  /* ── Open chat with contact ────────────────────── */
  const handleStartChat = useCallback(
    async (userId: string) => {
      try {
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
      } catch {
        toast.error("Failed to open conversation");
      }
    },
    [axiosPrivate, setActiveId, router],
  );

  /* ── Unfriend ───────────────────────────── */
  const handleUnfriend = useCallback(
    async (userId: string) => {
      try {
        await unfriend(userId);
        if (selectedContact?._id === userId) setSelectedContact(null);
        toast.success("Unfriended");
      } catch {
        toast.error("Failed to unfriend");
      }
    },
    [unfriend, selectedContact],
  );

  const isFriend = selectedContact
    ? friends.some((f) => f._id === selectedContact._id)
    : false;

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f6f8] dark:bg-[#0b0b18]">
      {/* ── Main Content ─────────────────────────── */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* ── Header ─────────────────────────────── */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-[#101022]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Contacts
            </h2>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
            <p className="text-sm text-slate-500">
              {friends.length} friends
            </p>
          </div>

          <button
            onClick={() => setShowAddFriendModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Friend
          </button>
        </header>

        {/* ── Contact List ─────────────────────────── */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-hidden">
            <ContactList
              selectedId={selectedContact?._id ?? null}
              onSelect={setSelectedContact}
              onStartChat={handleStartChat}
            />
          </div>

          {/* ── Contact Detail (Right Panel) ───────── */}
          {selectedContact ? (
            <ContactDetail
              contact={selectedContact}
              isFriend={isFriend}
              onStartChat={handleStartChat}
              onUnfriend={handleUnfriend}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </main>

      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
      />
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
function EmptyState() {
  return (
    <aside className="hidden xl:flex w-80 flex-col items-center justify-center border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#101022]">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-primary/10">
        <Users className="w-10 h-10 text-primary" />
      </div>
      <div className="text-center mt-4">
        <p className="font-bold text-lg mb-1 text-slate-900 dark:text-white">
          Select a contact
        </p>
        <p className="text-sm text-slate-500">
          Choose a contact to view their profile
        </p>
      </div>
    </aside>
  );
}
