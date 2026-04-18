"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { User } from "@/types";
import { useFriendStore } from "@/store";
import { useFriendService } from "@/services";
import { UserPlus } from "lucide-react";
import toast from "react-hot-toast";

import SearchBar from "./SearchBar";
import ContactRow from "./ContactRow";
import RequestCard from "./RequestCard";
import SearchResultRow from "./SearchResultRow";
import ContactSkeleton from "./ContactSkeleton";
import { usePresenceStore } from "@/store";

type TabId = "all" | "online" | "pending" | "blocked";

interface ContactListProps {
  selectedId: string | null;
  onSelect: (user: User) => void;
  onStartChat: (userId: string) => void;
}

export default function ContactList({
  selectedId,
  onSelect,
  onStartChat,
}: ContactListProps) {
  const [tab, setTab] = useState<TabId>("all");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [pendingSend, setPendingSend] = useState<Set<string>>(new Set());

  const friends = useFriendStore((s) => s.friends);
  const friendRequests = useFriendStore((s) => s.friendRequests);
  const isOnline = usePresenceStore((s) => s.isOnline);

  const {
    isLoadingFriends,
    isSearching,
    loadFriends,
    loadFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    searchUsers,
    cancelFriendRequest,
  } = useFriendService();

  // Separate online and offline friends
  const onlineFriends = friends.filter((f) => isOnline(f._id));
  const offlineFriends = friends.filter((f) => !isOnline(f._id));

  /* ── Load data on mount ─────────────────────── */
  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, []);

  /* ── Search debounce ────────────────────────── */
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (tab !== "all" && tab !== "online") return;
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

  /* ── Handlers ───────────────────────────────── */
  const handleSendRequest = async (user: User) => {
    setPendingSend((prev) => new Set(prev).add(user._id));
    try {
      await sendFriendRequest(user._id);
      toast.success(`Sent friend request to ${user.name}`);
      setSearchResults((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, friendStatus: "sent" } : u
        )
      );
    } catch {
      toast.error("Failed to send request");
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
      toast.success(`You are now friends with ${user.name}`);
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const handleReject = async (user: User) => {
    try {
      await rejectFriendRequest(user._id);
    } catch {
      toast.error("Failed to reject request");
    }
  };

  const handleCancel = async (user: User) => {
    try {
      await cancelFriendRequest(user._id);
    } catch {
      toast.error("Failed to reject request");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f6f6f8] dark:bg-[#0b0b18]">
      {/* ── Search Bar ─────────────────────────────── */}
      <div className="px-8 py-4 shrink-0">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={
            tab === "pending" ? "Search pending requests..." : "Search for friends or handles..."
          }
        />
      </div>

      {/* ── Tabs ─────────────────────────────────── */}
      <div className="flex gap-6 px-8 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab("all")}
          className={`text-sm font-medium pb-4 pt-1 -mb-0.5 transition-colors border-b-2 ${
            tab === "all"
              ? "text-primary border-primary"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent"
          }`}
        >
          All Friends
          <span className="ml-2 text-xs text-slate-400">{friends.length}</span>
        </button>
        <button
          onClick={() => setTab("online")}
          className={`text-sm font-medium pb-4 pt-1 -mb-0.5 transition-colors border-b-2 ${
            tab === "online"
              ? "text-primary border-primary"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent"
          }`}
        >
          Online
          <span className="ml-2 text-xs text-green-500">{onlineFriends.length}</span>
        </button>
        <button
          onClick={() => setTab("pending")}
          className={`text-sm font-medium pb-4 pt-1 -mb-0.5 transition-colors border-b-2 ${
            tab === "pending"
              ? "text-primary border-primary"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white border-transparent"
          }`}
        >
          Pending
          {friendRequests.length > 0 && (
            <span className="ml-2 bg-primary px-1.5 py-0.5 rounded text-[10px] text-white">
              {friendRequests.length}
            </span>
          )}
        </button>
       
      </div>

      {/* ── Content ────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <div className="max-w-6xl mx-auto space-y-1">
          {/* All Friends Tab */}
          {tab === "all" && (
            <>
              {isLoadingFriends ? (
                <ContactSkeleton />
              ) : friends.length === 0 ? (
                <EmptyState icon="👥" text="No friends yet. Start adding!" />
              ) : (
                <>
                  {/* Online Section */}
                  <SectionHeader label="Online" count={onlineFriends.length} />
                  {onlineFriends.map((user) => (
                    <ContactRow
                      key={user._id}
                      user={user}
                      selected={selectedId === user._id}
                      onClick={() => onSelect(user)}
                      onStartChat={onStartChat}
                    />
                  ))}

                  {/* Offline Section */}
                  <SectionHeader label="Offline" count={offlineFriends.length} />
                  {offlineFriends.map((user) => (
                    <ContactRow
                      key={user._id}
                      user={user}
                      selected={selectedId === user._id}
                      onClick={() => onSelect(user)}
                      onStartChat={onStartChat}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {/* Online Tab */}
          {tab === "online" && (
            <>
              {isLoadingFriends ? (
                <ContactSkeleton />
              ) : onlineFriends.length === 0 ? (
                <EmptyState icon="🌐" text="No friends online right now" />
              ) : (
                <>
                  <SectionHeader label="Online" count={onlineFriends.length} />
                  {onlineFriends.map((user) => (
                    <ContactRow
                      key={user._id}
                      user={user}
                      selected={selectedId === user._id}
                      onClick={() => onSelect(user)}
                      onStartChat={onStartChat}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {/* Pending Tab */}
          {tab === "pending" && (
            <>
              {friendRequests.length === 0 ? (
                <EmptyState icon="💌" text="No pending friend requests" />
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  {friendRequests.map((user) => (
                    <RequestCard
                      key={user._id}
                      user={user}
                      onAccept={() => handleAccept(user)}
                      onReject={() => handleReject(user)}
                      onCancel={() => handleCancel(user)}
                      onClick={() => onSelect(user)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Blocked Tab */}
          {tab === "blocked" && (
            <EmptyState icon="🚫" text="No blocked users" />
          )}
        </div>
      </div>

      {/* ── Add Friend FAB (mobile) ─────────────── */}
      <button className="fixed bottom-6 right-6 lg:hidden flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors">
        <UserPlus className="w-5 h-5" />
        <span className="text-sm font-semibold">Add Friend</span>
      </button>
    </div>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function SectionHeader({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
      {label} — {count}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
