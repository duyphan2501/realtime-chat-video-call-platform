import { create } from "zustand";
import type { Message, Reaction } from "@/types";

interface MessageState {
  messages: Record<string, Message[]>; // CID -> Message[]
  replyingTo: Message | null;
  
  // Actions
  setMessages: (cid: string, msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  updateReactions: (cid: string, msgId: string, reactions: Reaction[]) => void;
  markDeleted: (cid: string, msgId: string) => void;
  markSeen: (cid: string, msgId: string, seen: { user: string; seenAt: string }) => void;
  setReplyingTo: (m: Message | null) => void;
  clearCache: (cid: string) => void; // Giải phóng RAM khi cần
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: {},
  replyingTo: null,
  setMessages: (cid, msgs) => set((s) => ({
    messages: { ...s.messages, [cid]: msgs }
  })),

  addMessage: (msg) => set((s) => {
    const cid = typeof msg.conversation === 'string' ? msg.conversation : (msg.conversation as any)._id;
    return {
      messages: { ...s.messages, [cid]: [...(s.messages[cid] || []), msg] }
    };
  }),

  updateReactions: (cid, msgId, reactions) => set((s) => ({
    messages: {
      ...s.messages,
      [cid]: (s.messages[cid] || []).map(m => m._id === msgId ? { ...m, reactions } : m)
    }
  })),

  markDeleted: (cid, msgId) => set((s) => ({
    messages: {
      ...s.messages,
      [cid]: (s.messages[cid] || []).map(m => 
        m._id === msgId ? { ...m, isDeletedForAll: true, content: "Tin nhắn đã thu hồi", attachments: [] } : m
      )
    }
  })),

  markSeen: (cid, msgId, seen) => set((s) => ({
    messages: {
      ...s.messages,
      [cid]: (s.messages[cid] || []).map(m => 
        m._id === msgId ? { ...m, seenBy: [...(m.seenBy || []), seen] } : m
      )
    }
  })),

  setReplyingTo: (m) => set({ replyingTo: m }),
  clearCache: (cid) => set((s) => {
    const next = { ...s.messages };
    delete next[cid];
    return { messages: next };
  }),
}));
