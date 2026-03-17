/* ═══════════════════════════════════════════════════════════
   components/chat/ConversationList.tsx

   TODO — backend:
   ① Danh sách conversations đến từ conversationApi.getAll()
      đã được load ở page.tsx và lưu vào chatStore
   ② Tạo nhóm: mở CreateGroupModal
   ═══════════════════════════════════════════════════════════ */
"use client";
import { useState } from "react";
import type { Conversation, User } from "@/types";
import {
  selectIsOnline,
  useConversationStore,
  useMessageStore,
  usePresenceStore,
} from "@/store";
import { getConvName, getOtherId } from "@/utils/chat.utils";
import ConversationItem from "./ConversationItem";
import { Search } from "lucide-react";
import IconBtn from "../IconBtn";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  currentUser: User | null;
  onCreateGroup: () => void;
}

export default function ConversationList({
  conversations,
  activeId,
  currentUser,
  onCreateGroup,
}: Props) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"direct" | "group" | "unread">("direct");
  const setActiveId = useConversationStore((s) => s.setActiveId);
  const filtered = conversations.filter((c) => {
    const name = getConvName(c, currentUser);
    return name.toLowerCase().includes(query.toLowerCase());
  });

  const handleConvItemSelect = (conId: string) => {
    setActiveId(conId);
  };

  return (
    <div className="flex flex-col shrink-0 border-r w-[320px] border-gray-800">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-base text-white">Messages</span>
          <div className="flex gap-1">
            {/* TODO: filter / sort options */}
            <IconBtn title="Lọc" onClick={() => {}}>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" d="M3 4h18M7 12h10M11 20h2" />
              </svg>
            </IconBtn>
            {/* TODO ②: mở CreateGroupModal */}
            <IconBtn title="Tạo nhóm" onClick={onCreateGroup}>
              +
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
              </svg>
            </IconBtn>
          </div>
        </div>

        {/* Search */}
        <div className="relative text-gray-300">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm kiếm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none bg-gray"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mt-3">
          {(["direct", "group", "unread"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="text-sm font-semibold pb-1 transition-all capitalize mx-2"
              style={{
                color: tab === t ? "var(--color-brand)" : "var(--color-ink-4)",
                borderBottom:
                  tab === t
                    ? "2px solid var(--color-brand)"
                    : "2px solid transparent",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto border-t border-gray-800 pt-2">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span className="text-2xl">💬</span>
            <p className="text-sm" style={{ color: "var(--color-ink-4)" }}>
              There was no conversation
            </p>
          </div>
        )}
        {filtered.map((c) => {
          const isUserOnline = usePresenceStore(
            selectIsOnline(getOtherId(c, currentUser)),
          );
          const isActive = c._id === activeId;
          return (
            <ConversationItem
              key={c._id}
              conv={c}
              currentUser={currentUser}
              isOnline={isUserOnline}
              isActive={isActive}
              onSelect={handleConvItemSelect}
            />
          );
        })}
      </div>
    </div>
  );
}
