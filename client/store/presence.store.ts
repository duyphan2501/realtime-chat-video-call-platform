import { TypingUser } from "@/types";
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

interface PresenceState {
  onlineUsers: Record<string, boolean>;
  typingUsers: Record<string, TypingUser[]>;

  setOnline: (userId: string, online: boolean) => void;
  setOnlineUsers: (userIds: string[]) => void;
  setTyping: (cid: string, user: TypingUser) => void;
  clearTyping: (cid: string, userId: string) => void;
  clearConversation: (cid: string) => void;
  isOnline: (userId: string) => boolean;
  getTypingUsers: (cid: string) => TypingUser[];
}

const TYPING_TTL_MS = 3_000;

const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

function timerKey(cid: string, userId: string) {
  return `${cid}::${userId}`;
}

function scheduleExpiry(
  cid: string,
  userId: string,
  clearTyping: PresenceState["clearTyping"],
) {
  const key = timerKey(cid, userId);
  clearTimeout(typingTimers.get(key));
  typingTimers.set(
    key,
    setTimeout(() => {
      typingTimers.delete(key);
      clearTyping(cid, userId);
    }, TYPING_TTL_MS),
  );
}

function cancelExpiry(cid: string, userId: string) {
  const key = timerKey(cid, userId);
  clearTimeout(typingTimers.get(key));
  typingTimers.delete(key);
}

export const usePresenceStore = create<PresenceState>()(
  subscribeWithSelector((set, get) => ({
    onlineUsers: {},
    typingUsers: {},

    // Toggle online status — O(1), selector-friendly
    setOnline: (userId, online) =>
      set((s) => {
        if (Boolean(s.onlineUsers[userId]) === online) return {};
        return {
          onlineUsers: { ...s.onlineUsers, [userId]: online },
        };
      }),

    setOnlineUsers: (userIds: string[]) =>
      set((s) => {
        // Build new map from array — O(n), single pass
        const next: Record<string, boolean> = {};
        for (const id of userIds) next[id] = true;

        // Skip update if contents are identical
        const prev = s.onlineUsers;
        const prevKeys = Object.keys(prev);
        if (
          prevKeys.length === userIds.length &&
          prevKeys.every((id) => next[id])
        ) {
          return {};
        }
        return { onlineUsers: next };
      }),

    // Upsert typing user + reset TTL timer
    setTyping: (cid, user) => {
      set((s) => {
        const cur = s.typingUsers[cid] ?? [];
        const exists = cur.some((u) => u._id === user._id);

        // Upsert: update info if already present, otherwise append
        const next = exists
          ? cur.map((u) => (u._id === user._id ? user : u))
          : [...cur, user];

        return { typingUsers: { ...s.typingUsers, [cid]: next } };
      });

      // Always reschedule TTL — even on update
      scheduleExpiry(cid, user._id, get().clearTyping);
    },

    // Remove a single user from a conversation's typing list
    clearTyping: (cid, userId) => {
      cancelExpiry(cid, userId);
      set((s) => {
        const cur = s.typingUsers[cid];
        if (!cur) return {};

        const next = cur.filter((u) => u._id !== userId);

        const typingUsers = { ...s.typingUsers };
        // Clean up key entirely when list is empty
        if (next.length === 0) {
          delete typingUsers[cid];
        } else {
          typingUsers[cid] = next;
        }

        return { typingUsers };
      });
    },

    // Nuke all typing state for a conversation (e.g. on leave/close)
    clearConversation: (cid) => {
      const users = get().typingUsers[cid] ?? [];
      users.forEach((u) => cancelExpiry(cid, u._id));
      set((s) => {
        const typingUsers = { ...s.typingUsers };
        delete typingUsers[cid];
        return { typingUsers };
      });
    },

    // Derived selectors (stable references when used with usePresenceStore.getState())
    isOnline: (userId) => Boolean(get().onlineUsers[userId]),
    getTypingUsers: (cid) => get().typingUsers[cid] ?? [],
  })),
);

// ─── Typed selectors (use in components for minimal re-renders) ───────────────

export const selectIsOnline = (userId: string) => (s: PresenceState) =>
  Boolean(s.onlineUsers[userId]);

export const selectTypingUsers = (cid: string) => (s: PresenceState) =>
  s.typingUsers[cid] ?? EMPTY_ARRAY;

// Stable empty array ref — prevents new array identity on every selector call
const EMPTY_ARRAY: TypingUser[] = [];
