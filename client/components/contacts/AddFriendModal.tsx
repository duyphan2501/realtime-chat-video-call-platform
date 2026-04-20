"use client";
import { useState, useEffect, useRef } from "react";
import { UserPlus, Search, X, UserCheck, Loader2 } from "lucide-react";
import type { User } from "@/types";
import { useFriendService } from "@/services";
import { useFriendStore } from "@/store";
import toast from "react-hot-toast";
import { getAvatar } from "@/utils/user.utils";
import SearchBar from "./SearchBar";

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddFriendModal({
  isOpen,
  onClose,
}: AddFriendModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { searchUsers, sendFriendRequest, cancelFriendRequest } =
    useFriendService();
  const friends = useFriendStore((s) => s.friends);
  const friendRequests = useFriendStore((s) => s.friendRequests);
  const addFriendRequest = useFriendStore((s) => s.addFriendRequest);

  // Search debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const users = await searchUsers(query);
      // Filter out current user and existing friends
      const filtered = users.filter(
        (u) => !friends.some((f) => f._id === u._id),
      );
      setResults(filtered);
      setLoading(false);
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchUsers, friends, friendRequests]);

  const handleSendRequest = async (user: User) => {
    setSendingId(user._id);
    try {
      await sendFriendRequest(user._id);
      toast.success(`Sent friend request to ${user.name}`);
      addFriendRequest({ ...user, friendStatus: "sent" });
      // setResults((prev) => prev.filter((u) => u._id !== user._id));
    } catch {
      toast.error("Failed to send request");
    } finally {
      setSendingId(null);
    }
  };
  const handleCancelRequest = async (user: User) => {
    setSendingId(user._id);
    try {
      await cancelFriendRequest(user._id);
      toast.success(`Cancled friend request to ${user.name}`);
      // setResults((prev) => prev.filter((u) => u._id !== user._id));
    } catch {
      toast.error("Failed to cancled request");
    } finally {
      setSendingId(null);
    }
  };

  const handleClose = () => {
    setQuery("");
    setResults([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-[#101022] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-white">Add Friend</h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <SearchBar value={query} onChange={setQuery} placeholder="Search friends..." />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="px-4 pb-4 space-y-2">
              {results.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={getAvatar(user)}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  {user.friendStatus === "sent" ? (
                    /* Cancel Request button (For those who have sent but are waiting) */
                    <button
                      onClick={() => handleCancelRequest(user)}
                      disabled={sendingId === user._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-900/30 text-rose-400 hover:bg-rose-200 hover:text-red-700 transition-colors disabled:opacity-50"
                    >
                      {sendingId === user._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                      Cancel Request
                    </button>
                  ) : (
                    /* Nút Kết bạn (Dành cho người chưa có quan hệ gì) */
                    <button
                      onClick={() => handleSendRequest(user)}
                      disabled={sendingId === user._id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {sendingId === user._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="w-3.5 h-3.5" />
                      )}
                      Add Friend
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-white">No users found</p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching with a different email or phone
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm font-medium text-white">
                Find friends by email or phone
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Enter a contact&apos;s information to send a friend request
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
