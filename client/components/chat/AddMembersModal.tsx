"use client";

import { useState } from "react";
import { Conversation, User } from "@/types";
import { useSearchFriends, useConversationService } from "@/services";
import useDebounce from "@/hooks/useDebounce";
import { Loader2, X } from "lucide-react";
import { getAvatar, getUserName, isValidUser } from "@/utils/user.utils";
import SearchBar from "../contacts/SearchBar";

interface AddMembersModalProps {
  conversation: Conversation;
  onClose: () => void;
}

export default function AddMembersModal({
  conversation,
  onClose,
}: AddMembersModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<User[]>([]);
  const searchTerm = useDebounce(query, 500);

  const { data: friends = [] } = useSearchFriends(searchTerm);
  const { addMembers, isAddingMembers } = useConversationService();

  // Filter out friends who are already in the group
  const existingIds = new Set(
    (conversation.participants ?? []).map((p) => p.user?._id),
  );
  const availableFriends = friends
    .filter(isValidUser)
    .filter((f: User) => !existingIds.has(f._id));

  const toggle = (u: User) =>
    setSelected((prev) =>
      prev.find((p) => p._id === u._id)
        ? prev.filter((p) => p._id !== u._id)
        : [...prev, u],
    );

  const handleAdd = async () => {
    if (selected.length === 0) return;
    try {
      await addMembers({
        conversationId: conversation._id,
        userIds: selected.map((u) => u._id),
      });
      onClose();
    } catch (error) {
      // Error is typically handled by the service's toast notifications
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-[2rem] animate-scale-in pointer-events-auto overflow-hidden border border-white/5"
          style={{
            background: "var(--color-surface)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-5 shrink-0"
            style={{ borderBottom: "1px solid var(--color-gray)" }}
          >
            <div>
              <h3 className="font-bold text-lg text-white">Add Members</h3>
              <p
                className="text-xs opacity-50"
                style={{ color: "var(--color-ink-4)" }}
              >
                {selected.length} {selected.length === 1 ? "person" : "people"}{" "}
                selected
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full transition-all hover:bg-white/10 active:scale-90"
              style={{ color: "var(--color-ink-3)" }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col p-6 space-y-4">
            {/* Search input */}
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search for friends..."
            />

            {/* Selected chips (Scrollable area) */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pb-2 custom-scrollbar">
                {selected.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full text-xs font-medium animate-in zoom-in-95 duration-200"
                    style={{
                      background: "var(--color-dark-secondary)",
                      color: "var(--color-primary)",
                      border: "1px solid rgba(43, 43, 238, 0.3)",
                    }}
                  >
                    <img
                      src={getAvatar(u)}
                      alt={getUserName(u)}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span>{getUserName(u)}</span>
                    <button
                      onClick={() => toggle(u)}
                      className="hover:text-white transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Friends list */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              {availableFriends.map((f: User) => {
                const isChecked = !!selected.find((s) => s._id === f._id);
                return (
                  <label
                    key={f._id}
                    className="flex items-center gap-4 p-3 rounded-2xl cursor-pointer transition-all hover:bg-white/[0.03] group"
                  >
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(f)}
                        className="peer hidden"
                      />
                      <div className="w-5 h-5 rounded-md border-2 border-white/20 peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)] flex items-center justify-center transition-all">
                        {isChecked && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                    </div>

                    <img
                      src={getAvatar(f)}
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                      alt={getUserName(f)}
                    />

                    <div className="flex-1">
                      <span className="text-sm font-semibold text-white/90 group-hover:text-white">
                        {getUserName(f)}
                      </span>
                    </div>
                  </label>
                );
              })}

              {availableFriends.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                  <p className="text-sm">
                    {query ? "No results found" : "No more friends to add"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className="flex gap-3 px-6 py-5 shrink-0"
            style={{ borderTop: "1px solid var(--color-gray)" }}
          >
            <button
              onClick={onClose}
              disabled={isAddingMembers}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all hover:brightness-125 disabled:opacity-50"
              style={{
                background: "var(--color-dark-gray)",
                color: "var(--color-ink-2)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={isAddingMembers || selected.length === 0}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white transition-all active:scale-[0.96] disabled:grayscale disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              style={{ background: "var(--color-primary)" }}
            >
              {isAddingMembers ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                `Add Members (${selected.length})`
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
