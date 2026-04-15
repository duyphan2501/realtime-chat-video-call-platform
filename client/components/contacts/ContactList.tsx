"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { User } from "@/types";
import { useFriendStore, usePresenceStore } from "@/store";
import { Search, UserPlus, X, Check, UserCheck } from "lucide-react";
import { useFriendService } from "@/services";
import toast from "react-hot-toast";

type Tab = "friends" | "requests" | "search";

interface Props {
  selectedId: string | null;
  onSelect: (user: User) => void;
}

export default function ContactList({ selectedId, onSelect }: Props) {
  const [tab, setTab] = useState<Tab>("friends");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [pendingSend, setPendingSend] = useState<Set<string>>(new Set());

  const friends = useFriendStore((s) => s.friends);
  const friendRequests = useFriendStore((s) => s.friendRequests);

  const {
    isLoadingFriends,
    isSearching,
    loadFriends,
    loadFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers,
  } = useFriendService();

  /* ── Load data on mount ─────────────────────── */
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  /* ── Search debounce ────────────────────────── */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (tab !== "search") return;
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const res = await searchUsers(query);
      setSearchResults(res);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, tab]);

  /* ── Alphabetical grouping ──────────────────── */
  const grouped = groupByFirstLetter(friends);

  /* ── Handlers ───────────────────────────────── */
  const handleSendRequest = async (user: User) => {
    setPendingSend((prev) => new Set(prev).add(user._id));
    try {
      await sendFriendRequest(user._id);
      toast.success(`Đã gửi lời mời đến ${user.name}`);
      setSearchResults((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, friendStatus: "sent" } : u,
        ),
      );
    } catch (error: any) {
      toast.error("Không thể gửi lời mời");
    } finally {
      setPendingSend((prev) => {
        const s = new Set(prev);
        s.delete(user._id);
        return s;
      });
    }
  };

  const handleAccept = async (user: User) => {
    try {
      await acceptFriendRequest(user._id);
      toast.success(`Đã kết bạn với ${user.name}`);
    } catch {
      toast.error("Lỗi khi chấp nhận lời mời");
    }
  };

  const handleReject = async (user: User) => {
    try {
      await rejectFriendRequest(user._id);
    } catch {
      toast.error("Lỗi khi từ chối lời mời");
    }
  };

  return (
    <div className="flex flex-col h-full shrink-0 w-[320px] bg-dark-primary border-r border-gray-800">
      {/* ── Header ─────────────────────────────── */}
      <div className="px-4 pt-6 pb-2 shrink-0">
        <h1 className="font-bold  mb-3 pb-2 text-white px-1">Danh bạ</h1>

        {/* Search bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 bg-dark-gray border border-gray-800 focus-within:border-primary transition-colors">
          <Search className="w-4 h-4 shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder={
              tab === "search" ? "Tìm bằng tên hoặc email..." : "Tìm bạn bè..."
            }
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (tab !== "search" && e.target.value) setTab("search");
            }}
            onFocus={() => {
              if (query) setTab("search");
            }}
            className="flex-1 bg-transparent text-sm outline-none text-white placeholder:text-gray-500"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setSearchResults([]);
              }}
              className="text-gray-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 text-sm border-b border-gray-800">
          <TabBtn
            id="friends"
            active={tab === "friends"}
            onClick={() => {
              setTab("friends");
              setQuery("");
            }}
          >
            Bạn bè
          </TabBtn>
          <TabBtn
            id="requests"
            active={tab === "requests"}
            onClick={() => {
              setTab("requests");
              setQuery("");
            }}
            badge={friendRequests.length}
          >
            Lời mời
          </TabBtn>
          <TabBtn
            id="search"
            active={tab === "search"}
            onClick={() => setTab("search")}
          >
            Tìm kiếm
          </TabBtn>
        </div>
      </div>

      {/* ── Content ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Friends Tab */}
        {tab === "friends" && (
          <>
            {isLoadingFriends ? (
              <FriendsSkeleton />
            ) : friends.length === 0 ? (
              <Empty icon="👥" text="Chưa có bạn bè nào" />
            ) : (
              Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([letter, users]) => (
                  <div key={letter}>
                    <div className="px-4 py-1.5 text-xs font-bold sticky top-0 z-10 text-gray-400 bg-dark-primary border-b border-gray-800">
                      {letter}
                    </div>
                    {users.map((u) => (
                      <FriendRow
                        key={u._id}
                        user={u}
                        selected={selectedId === u._id}
                        onClick={() => onSelect(u)}
                      />
                    ))}
                  </div>
                ))
            )}
          </>
        )}

        {/* Requests Tab */}
        {tab === "requests" && (
          <>
            {friendRequests.length === 0 ? (
              <Empty icon="💌" text="Không có lời mời nào" />
            ) : (
              <div className="p-3 flex flex-col gap-2">
                {friendRequests.map((u) => (
                  <RequestCard
                    key={u._id}
                    user={u}
                    onAccept={() => handleAccept(u)}
                    onReject={() => handleReject(u)}
                    onClick={() => onSelect(u)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Search Tab */}
        {tab === "search" && (
          <>
            {isSearching ? (
              <FriendsSkeleton />
            ) : !query.trim() ? (
              <Empty icon="🔍" text="Nhập tên hoặc email để tìm kiếm" />
            ) : searchResults.length === 0 ? (
              <Empty icon="😶" text="Không tìm thấy kết quả" />
            ) : (
              <div className="p-3 flex flex-col gap-1">
                {searchResults.map((u) => {
                  const isFriend =
                    u.friendStatus === "friend" ||
                    friends.some((f) => f._id === u._id);
                  const isSent =
                    u.friendStatus === "sent" || pendingSend.has(u._id);
                  return (
                    <SearchResultRow
                      key={u._id}
                      user={u}
                      isFriend={isFriend}
                      isSent={isSent}
                      selected={selectedId === u._id}
                      onClick={() => onSelect(u)}
                      onAddFriend={() => handleSendRequest(u)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function TabBtn({
  id,
  active,
  onClick,
  badge,
  children,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1 px-3 py-2 text-sm font-medium transition-all border-b-2 ${
        active
          ? "text-primary border-primary"
          : "text-gray-400 border-transparent hover:text-gray-200"
      }`}
    >
      {children}
      {!!badge && badge > 0 && (
        <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full leading-none bg-red-500">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

function FriendRow({
  user,
  selected,
  onClick,
}: {
  user: User;
  selected: boolean;
  onClick: () => void;
}) {
  const isOnline = usePresenceStore((s) => s.isOnline);
  const online = isOnline(user._id);

  return (
    <div
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left cursor-pointer ${
        selected ? "bg-gray-800" : "hover:bg-gray-800/50"
      }`}
    >
      <div className="relative shrink-0">
        <img
          src={
            user.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e3e8f0&color=0068FF&bold=true&size=40`
          }
          className="w-10 h-10 rounded-full object-cover"
          alt={user.name}
        />
        {online && (
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-dark-primary bg-green-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate text-white">{user.name}</p>
        <p
          className={`text-xs truncate ${online ? "text-green-500" : "text-gray-400"}`}
        >
          {online ? "Đang hoạt động" : "Ngoại tuyến"}
        </p>
      </div>
    </div>
  );
}

function RequestCard({
  user,
  onAccept,
  onReject,
  onClick,
}: {
  user: User;
  onAccept: () => void;
  onReject: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-colors bg-dark-gray hover:bg-gray-800"
      onClick={onClick}
    >
      <img
        src={
          user.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e3e8f0&color=0068FF&bold=true&size=40`
        }
        className="w-10 h-10 rounded-full object-cover shrink-0"
        alt={user.name}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate text-white">{user.name}</p>
        <p className="text-xs truncate text-gray-400">{user.email}</p>
        <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onAccept}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-white transition-all active:scale-95 bg-primary hover:bg-blue-600"
          >
            <Check className="w-3 h-3" />
            Đồng ý
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            <X className="w-3 h-3" />
            Từ chối
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchResultRow({
  user,
  isFriend,
  isSent,
  selected,
  onClick,
  onAddFriend,
}: {
  user: User;
  isFriend: boolean;
  isSent: boolean;
  selected: boolean;
  onClick: () => void;
  onAddFriend: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left cursor-pointer ${
        selected ? "bg-gray-800" : "hover:bg-gray-800/50"
      }`}
    >
      <img
        src={
          user.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e3e8f0&color=0068FF&bold=true&size=40`
        }
        className="w-10 h-10 rounded-full object-cover shrink-0"
        alt={user.name}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate text-white">{user.name}</p>
        <p className="text-xs truncate text-gray-400">{user.email}</p>
      </div>
      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        {isFriend ? (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary">
            <UserCheck className="w-3 h-3" />
            Bạn bè
          </span>
        ) : isSent ? (
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-700 text-gray-400">
            Đã gửi
          </span>
        ) : (
          <button
            onClick={onAddFriend}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white transition-all active:scale-95 bg-primary hover:bg-blue-600"
          >
            <UserPlus className="w-3 h-3" />
            Kết bạn
          </button>
        )}
      </div>
    </div>
  );
}

function FriendsSkeleton() {
  return (
    <div className="p-4 flex flex-col gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-gray-800" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-3 rounded-full w-2/3 bg-gray-800" />
            <div className="h-2.5 rounded-full w-1/3 bg-gray-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}

/* ── Helpers ──────────────────────────────────────────────── */
function groupByFirstLetter(users: User[]): Record<string, User[]> {
  return users.reduce(
    (acc, user) => {
      const letter = user.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .charAt(0)
        .toUpperCase();
      const key = /[A-Z]/.test(letter) ? letter : "#";
      if (!acc[key]) acc[key] = [];
      acc[key].push(user);
      return acc;
    },
    {} as Record<string, User[]>,
  );
}
