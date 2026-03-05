import { create } from "zustand";

interface TypingUser { _id: string; fullName: string; avatar: string; }

interface PresenceState {
  onlineUsers: Set<string>;
  typingUsers: Record<string, TypingUser[]>;
  setOnline: (userId: string, v: boolean) => void;
  setTyping: (cid: string, user: TypingUser) => void;
  clearTyping: (cid: string, userId: string) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUsers: new Set(),
  typingUsers: {},
  setOnline: (userId, v) => set((s) => {
    const next = new Set(s.onlineUsers);
    v ? next.add(userId) : next.delete(userId);
    return { onlineUsers: next };
  }),
  setTyping: (cid, user) => set((s) => {
    const cur = s.typingUsers[cid] || [];
    if (cur.some((u) => u._id === user._id)) return s;
    return { typingUsers: { ...s.typingUsers, [cid]: [...cur, user] } };
  }),
  clearTyping: (cid, userId) => set((s) => ({
    typingUsers: { ...s.typingUsers, [cid]: (s.typingUsers[cid] || []).filter((u) => u._id !== userId) },
  })),
}));
