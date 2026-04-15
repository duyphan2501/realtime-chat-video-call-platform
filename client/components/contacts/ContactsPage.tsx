"use client";
import { useState, useCallback } from "react";
import type { User } from "@/types";
import { useAuthStore, useConversationStore, useFriendStore } from "@/store";
import ContactList from "./ContactList";
import ContactDetail from "./ContactDetail";
import { useFriendService } from "@/services";
import { useRouter } from "next/navigation";
import { conversationAPI } from "@/API/conversation.api";
import useAxiosPrivate from "@/hooks/useAxiosPrivate";
import toast from "react-hot-toast";
import { Users } from "lucide-react";

export default function ContactsPage() {
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const currentUser = useAuthStore((s) => s.user);
  const friends = useFriendStore((s) => s.friends);
  const { unfriend } = useFriendService();
  const setActiveId = useConversationStore((s) => s.setActiveId);
  const router = useRouter();
  const axiosPrivate = useAxiosPrivate();

  /* ── Mở chat với contact ────────────────────── */
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
        toast.error("Không thể mở cuộc trò chuyện");
      }
    },
    [axiosPrivate, setActiveId, router],
  );

  /* ── Huỷ kết bạn ───────────────────────────── */
  const handleUnfriend = useCallback(
    async (userId: string) => {
      try {
        await unfriend(userId);
        if (selectedContact?._id === userId) setSelectedContact(null);
        toast.success("Đã huỷ kết bạn");
      } catch {
        toast.error("Không thể huỷ kết bạn");
      }
    },
    [unfriend, selectedContact],
  );

  const isFriend = selectedContact
    ? friends.some((f) => f._id === selectedContact._id)
    : false;

  return (
    <div className="flex h-screen overflow-hidden bg-dark-primary">
      {/* ── Panel trái ─────────────────────────── */}
      <ContactList
        selectedId={selectedContact?._id ?? null}
        onSelect={setSelectedContact}
      />

      {/* ── Panel phải ─────────────────────────── */}
      <div className="flex-1 overflow-hidden">
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
    </div>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-primary/10">
        <Users className="w-10 h-10 text-primary" />
      </div>
      <div>
        <p className="font-bold text-lg mb-1 text-white">Danh bạ</p>
        <p className="text-sm text-gray-400">
          Chọn một liên hệ để xem thông tin
        </p>
      </div>
    </div>
  );
}
