/* ═══════════════════════════════════════════════════════════
   components/contacts/ContactsPage.tsx

   TODO — backend:
   ① getFriends: userApi.getFriends()
   ② getFriendRequests: userApi.getFriendRequests()
   ③ search: userApi.searchUsers()
   ④ sendFriendRequest / accept / reject / unfriend
   ⑤ openChat: tạo private conversation nếu chưa có
   ═══════════════════════════════════════════════════════════ */
"use client";
import { useState, useEffect } from "react";
import type { User } from "@/types";
import { useFriendStore, usePresenceStore } from "@/store";

type Tab = "friends" | "requests" | "search";

interface Props {
  currentUser: User;
  friends: User[];
  onOpenChat: (userId: string) => void;
}

export default function ContactsPage({
  currentUser,
  friends,
  onOpenChat,
}: Props) {
  const [tab, setTab] = useState<Tab>("friends");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const friendRequests = useFriendStore((s) => s.friendRequests);
  const removeFriendReq = useFriendStore((s) => s.removeFriendRequest);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      // TODO ③: userApi.searchUsers()
      // const res = await userApi.searchUsers(query);
      // setResults(res.users ?? res.data ?? []);
    } catch {
    } finally {
      setSearching(false);
    }
  };

  const handleAccept = async (userId: string) => {
    try {
      // TODO ④: accept friend request
      // await userApi.acceptFriendRequest(userId);
      removeFriendReq(userId);
    } catch {}
  };

  const handleReject = async (userId: string) => {
    try {
      // TODO ④: reject friend request
      // await userApi.rejectFriendRequest(userId);
      removeFriendReq(userId);
    } catch {}
  };

  const handleAddFriend = async (userId: string) => {
    try {
      // TODO ④: send friend request
      // await userApi.sendFriendRequest(userId);
    } catch {}
  };

  const handleUnfriend = async (userId: string) => {
    if (!confirm("Huỷ kết bạn?")) return;
    try {
      // TODO ④: unfriend
      // await userApi.unfriend(userId);
    } catch {}
  };

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Header */}
      <div
        className="px-6 pt-6 pb-4 shrink-0"
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-s3)",
        }}
      >
        <h2 className="font-bold text-lg mb-4">Danh bạ</h2>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-2xl"
          style={{ background: "var(--color-s2)", width: "fit-content" }}
        >
          {(
            [
              { id: "friends", label: "Bạn bè" },
              {
                id: "requests",
                label: `Lời mời${friendRequests.length ? ` (${friendRequests.length})` : ""}`,
              },
              { id: "search", label: "Tìm kiếm" },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: tab === t.id ? "white" : "transparent",
                color: tab === t.id ? "var(--color-ink)" : "var(--color-ink-3)",
                boxShadow: tab === t.id ? "var(--shadow-xs)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ── Friends ── */}
        {tab === "friends" && (
          <div className="grid grid-cols-1 gap-3 max-w-2xl">
            {friends.length === 0 && (
              <Empty icon="👥" text="Chưa có bạn bè nào" />
            )}
            {friends.map((f) => (
              <UserCard
                key={f._id}
                user={f}
                actions={[
                  {
                    label: "Nhắn tin",
                    primary: true,
                    onClick: () => onOpenChat(f._id),
                  },
                  {
                    label: "Huỷ bạn",
                    danger: true,
                    onClick: () => handleUnfriend(f._id),
                  },
                ]}
              />
            ))}
          </div>
        )}

        {/* ── Requests ── */}
        {tab === "requests" && (
          <div className="grid grid-cols-1 gap-3 max-w-2xl">
            {friendRequests.length === 0 && (
              <Empty icon="💌" text="Không có lời mời nào" />
            )}
            {friendRequests.map((u) => (
              <UserCard
                key={u._id}
                user={u}
                actions={[
                  {
                    label: "Chấp nhận",
                    primary: true,
                    onClick: () => handleAccept(u._id),
                  },
                  {
                    label: "Từ chối",
                    danger: true,
                    onClick: () => handleReject(u._id),
                  },
                ]}
              />
            ))}
          </div>
        )}

        {/* ── Search ── */}
        {tab === "search" && (
          <div className="max-w-2xl">
            <div className="flex gap-2 mb-5">
              <div className="relative flex-1">
                <SearchIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--color-ink-4)" }}
                />
                <input
                  type="text"
                  placeholder="Tìm bằng tên hoặc email..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-9 pr-4 py-3 rounded-2xl text-sm outline-none"
                  style={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-s3)",
                  }}
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
                style={{ background: "var(--color-brand)" }}
              >
                {searching ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  "Tìm"
                )}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {results.length === 0 && query && !searching && (
                <Empty icon="🔍" text="Không tìm thấy kết quả" />
              )}
              {results.map((u) => {
                const isFriend = friends.some((f) => f._id === u._id);
                const isSelf = u._id === currentUser._id;
                return (
                  <UserCard
                    key={u._id}
                    user={u}
                    actions={
                      isSelf
                        ? []
                        : isFriend
                          ? [
                              {
                                label: "Nhắn tin",
                                primary: true,
                                onClick: () => onOpenChat(u._id),
                              },
                            ]
                          : u.friendStatus === "sent"
                            ? [
                                {
                                  label: "Đã gửi lời mời",
                                  disabled: true,
                                  onClick: () => {},
                                },
                              ]
                            : [
                                {
                                  label: "Kết bạn",
                                  primary: true,
                                  onClick: () => handleAddFriend(u._id),
                                },
                              ]
                    }
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── UserCard ─────────────────────────────────────── */
interface Action {
  label: string;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function UserCard({ user: u, actions }: { user: User; actions: Action[] }) {
  const isOnline = usePresenceStore((s) => s.isOnline);

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-2xl transition-colors"
      style={{
        background: "var(--color-surface)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      <div className="relative shrink-0">
        <img
          src={
            u.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e3e8f0&color=0068FF&bold=true&size=44`
          }
          className="w-11 h-11 rounded-full object-cover"
          alt={u.name}
        />
        {isOnline(u._id) && (
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
            style={{ background: "var(--color-online)" }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold text-sm truncate"
          style={{ color: "var(--color-ink)" }}
        >
          {u.name}
        </p>
        <p className="text-xs truncate" style={{ color: "var(--color-ink-4)" }}>
          {u.email}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            disabled={a.disabled}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
            style={{
              background: a.primary
                ? "var(--color-brand)"
                : a.danger
                  ? "#FEF2F2"
                  : "var(--color-s2)",
              color: a.primary
                ? "white"
                : a.danger
                  ? "var(--color-danger)"
                  : "var(--color-ink-2)",
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm" style={{ color: "var(--color-ink-4)" }}>
        {text}
      </p>
    </div>
  );
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
