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
import { usePresenceStore } from "@/store";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  currentUser: User | null;
  onSelect: (id: string) => void;
  onCreateGroup: () => void;
}

export default function ConversationList({
  conversations,
  activeId,
  currentUser,
  onSelect,
  onCreateGroup,
}: Props) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "priority">("all");
  const onlineUsers = usePresenceStore((s) => s.onlineUsers);

  const filtered = conversations.filter((c) => {
    const name = getConvName(c, currentUser);
    return name.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div
      className="flex flex-col shrink-0 border-r"
      style={{
        width: 320,
        background: "var(--color-surface)",
        borderColor: "var(--color-s3)",
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span
            className="font-bold text-base"
            style={{ color: "var(--color-ink)" }}
          >
            Tin nhắn
          </span>
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
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
              </svg>
            </IconBtn>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "var(--color-ink-4)" }}
          />
          <input
            type="text"
            placeholder="Tìm kiếm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl text-sm outline-none"
            style={{ background: "var(--color-s2)", color: "var(--color-ink)" }}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-3 mt-3">
          {(["all", "priority"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="text-xs font-semibold pb-1 transition-all"
              style={{
                color: tab === t ? "var(--color-brand)" : "var(--color-ink-4)",
                borderBottom:
                  tab === t
                    ? "2px solid var(--color-brand)"
                    : "2px solid transparent",
              }}
            >
              {t === "all" ? "Tất cả" : "Ưu tiên"}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <span className="text-2xl">💬</span>
            <p className="text-sm" style={{ color: "var(--color-ink-4)" }}>
              Chưa có cuộc trò chuyện
            </p>
          </div>
        )}
        {filtered.map((c) => {
          const name = getConvName(c, currentUser);
          const avatar = getConvAvatar(c, currentUser);
          const isOnline =
            c.type === "private"
              ? onlineUsers.has(getOtherId(c, currentUser))
              : false;
          const isActive = c._id === activeId;

          return (
            <div
              key={c._id}
              onClick={() => onSelect(c._id)}
              className={`conv-item flex items-center gap-3 px-4 py-3 cursor-pointer${isActive ? " is-active" : ""}`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <img
                  src={
                    avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=e3e8f0&color=0068FF&bold=true&size=40`
                  }
                  alt={name}
                  className="w-11 h-11 rounded-full object-cover"
                />
                {isOnline && (
                  <span
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
                    style={{ background: "var(--color-online)" }}
                  />
                )}
                {c.type === "group" && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                    style={{ background: "var(--color-brand)", color: "white" }}
                  >
                    {c.participants.length}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className="font-semibold text-sm truncate"
                    style={{ color: "var(--color-ink)" }}
                  >
                    {name}
                  </span>
                  <span
                    className="text-[11px] ml-2 shrink-0"
                    style={{ color: "var(--color-ink-4)" }}
                  >
                    {fmtTime(c.updatedAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs truncate"
                    style={{ color: "var(--color-ink-3)" }}
                  >
                    {getPreview(c, currentUser)}
                  </span>
                  {c.unreadCount > 0 && (
                    <span
                      className="ml-2 min-w-4.5 h-4.5 flex items-center justify-center rounded-full text-white font-bold shrink-0 px-1"
                      style={{ background: "var(--color-brand)", fontSize: 10 }}
                    >
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────── */
function getOtherId(c: Conversation, me: User | null): string {
  return (
    c.participants.find((p) => {
      const id = typeof p.user === "object" ? p.user._id : p.user;
      return id !== me?._id;
    })?.user?._id ?? ""
  );
}

function getConvName(c: Conversation, me: User | null): string {
  if (c.type === "group") return c.name || "Nhóm chat";
  const other = c.participants.find((p) => {
    const id = typeof p.user === "object" ? p.user._id : p.user;
    return id !== me?._id;
  });
  return (other?.user as User)?.name || "Người dùng";
}

function getConvAvatar(c: Conversation, me: User | null): string | undefined {
  if (c.type === "group") return c.avatar;
  const other = c.participants.find((p) => {
    const id = typeof p.user === "object" ? p.user._id : p.user;
    return id !== me?._id;
  });
  return (other?.user as User)?.avatar;
}

function getPreview(c: Conversation, me: User | null): string {
  const lm = c.lastMessage;
  if (!lm) return "Chưa có tin nhắn";
  const isMine = (lm.sender as User)?._id === me?._id;
  const prefix = isMine ? "Bạn: " : "";
  if (lm.type === "image") return prefix + "📷 Hình ảnh";
  if (lm.type === "file") return prefix + "📎 Tệp đính kèm";
  if (lm.type === "video") return prefix + "📹 Video";
  if (lm.type === "call") return "📞 Cuộc gọi";
  return prefix + (lm.content || "");
}

function fmtTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const secs = (now.getTime() - d.getTime()) / 1000;
  if (secs < 60) return "Vừa xong";
  if (secs < 3600) return `${Math.floor(secs / 60)} phút`;
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

const SearchIcon = ({
  className,
  style,
}: {
  className: string;
  style?: React.CSSProperties;
}) => (
  <svg
    className={className}
    style={style}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="11" cy="11" r="8" />
    <path strokeLinecap="round" d="m21 21-4.35-4.35" />
  </svg>
);

function IconBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
      style={{ color: "var(--color-ink-3)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--color-s2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
