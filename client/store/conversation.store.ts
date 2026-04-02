import { create } from "zustand";
import type { Conversation, Message } from "@/types";

interface ConversationState {
  // Key là _id của conversation
  conversations: Map<string, Conversation>;
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
  bumpConversation: (msg: Message, newUnreadCount?: number) => void;
  markAsRead: (id: string) => void;
  updateSeen: (cid: string, userId: string, lastRead?: Date) => void;
  getParticipantUser: (cid: string, userId: string) => any;
}

export const useConversationStore = create<ConversationState>((set) => ({
  conversations: new Map(),
  convCursor: { cursor: null, lastId: null },
  activeId: null,

  setActiveId: (id) => set({ activeId: id }),
  setConvCursor: (nextCursor) => set({ convCursor: nextCursor }),

  // Khởi tạo Map từ Array
  setConversations: (conversations) => {
    const map = new Map();
    conversations.forEach((c) => map.set(c._id, c));
    set({ conversations: map });
  },

  // Thêm một hội thoại mới lên đầu Map
  addConversation: (c) =>
    set((s) => {
      const newMap = new Map(s.conversations);
      if (newMap.has(c._id)) newMap.delete(c._id);

      // Để render theo thứ tự mới nhất lên đầu,
      // ta tạo Map mới: [Key mới, ...Map cũ]
      return { conversations: new Map([[c._id, c], ...newMap]) };
    }),

  updateConversation: (id, d) =>
    set((s) => {
      const newMap = new Map(s.conversations);
      const target = newMap.get(id);
      if (target) {
        newMap.set(id, { ...target, ...d });
      }
      return { conversations: newMap };
    }),

  bumpConversation: (msg, newUnreadCount) =>
    set((s) => {
      const cid =
        typeof msg.conversation === "string"
          ? msg.conversation
          : (msg.conversation as any)._id;

      const newMap = new Map(s.conversations);
      const targetConv = newMap.get(cid);

      if (!targetConv) return s;

      // Cập nhật dữ liệu mới
      const updated: Conversation = {
        ...targetConv,
        lastMessage: {
          content: msg.content || "",
          sender: msg.sender,
          type: msg.type,
          attachments: msg.attachments,
          createdAt: msg.createdAt,
        },
        unreadCount:
          newUnreadCount !== undefined
            ? newUnreadCount
            : (targetConv.unreadCount || 0) + 1,
      };

      // Kỹ thuật Bump: Xóa và Set lại để nó nhảy lên "cuối" Map (hoặc đầu tùy cách render)
      // Trong JS Map, phần tử mới insert sẽ nằm cuối.
      // Nhưng để logic UI chuẩn (unshift), ta sẽ làm thế này:
      newMap.delete(cid);
      return { conversations: new Map([[cid, updated], ...newMap]) };
    }),

  markAsRead: (id) =>
    set((s) => {
      const newMap = new Map(s.conversations);
      const target = newMap.get(id);
      if (target) {
        newMap.set(id, { ...target, unreadCount: 0 });
      }
      return { conversations: newMap };
    }),

  updateSeen: (cid, userId, lastRead = new Date()) =>
    set((s) => {
      // 1. Lấy hội thoại từ Map
      const targetConv = s.conversations.get(cid);
      if (!targetConv) return s;

      // 2. Cập nhật danh sách participants
      const updatedParticipants = targetConv.participants.map((p) => {
        if (p.user._id === userId) {
          return {
            ...p,
            lastRead,
          };
        }
        return p;
      });

      // 3. Tạo Map mới để đảm bảo tính Immutable (Zustand yêu cầu reference mới để re-render)
      const newMap = new Map(s.conversations);
      newMap.set(cid, {
        ...targetConv,
        participants: updatedParticipants,
      });

      return { conversations: newMap };
    }),

  getParticipantUser: (cid, userId) => {
    const conv = useConversationStore.getState().conversations.get(cid);
    if (!conv) return null;
    const participant = conv.participants.find((p) => p.user._id === userId);
    return participant ? participant.user : null;
  },
}));
