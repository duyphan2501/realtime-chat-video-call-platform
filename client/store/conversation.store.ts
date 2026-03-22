import { create } from "zustand";
import type { Conversation, Message } from "@/types";

interface ConversationState {
  conversations: Conversation[];
  convCursor: {
    cursor: Date | null;
    lastId: string | null;
  };
  activeId: string | null;

  // Actions
  setActiveId: (id: string | null) => void;
  setConvCursor: (nextCursor: { cursor: Date; lastId: string }) => void;
  setConversations: (c: Conversation[]) => void;
  addConversation: (c: Conversation) => void;
  updateConversation: (id: string, d: Partial<Conversation>) => void;

  // Cập nhật lastMessage và đẩy lên đầu khi có tin nhắn mới
  bumpConversation: (msg: Message) => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  conversations: [],
  convCursor: {
    cursor: null,
    lastId: null,
  },
  activeId: null,

  setActiveId: (id) => set({ activeId: id }),
  setConvCursor: (nextCursor) => set({ convCursor: nextCursor }),
  setConversations: (conversations) => set({ conversations }),

  addConversation: (c) =>
    set((s) => ({
      conversations: [c, ...s.conversations.filter((x) => x._id !== c._id)],
    })),

  updateConversation: (id, d) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c._id === id ? { ...c, ...d } : c,
      ),
    })),

  bumpConversation: (msg) =>
    set((s) => {
      const cid =
        typeof msg.conversation === "string"
          ? msg.conversation
          : (msg.conversation as any)._id;
          
      const targetIdx = s.conversations.findIndex((c) => c._id === cid);
      if (targetIdx === -1) return s;

      const newConvs = [...s.conversations];
      const updated = {
        ...newConvs[targetIdx],
        lastMessage: {
          content: msg.content || "",
          sender: msg.sender,
          type: msg.type,
          createdAt: msg.createdAt,
        },
        updatedAt: msg.createdAt,
      };

      newConvs.splice(targetIdx, 1);
      newConvs.unshift(updated);
      return { conversations: newConvs };
    }),
}));
