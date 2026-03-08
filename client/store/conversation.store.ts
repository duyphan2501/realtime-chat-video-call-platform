import { create } from "zustand";
import type { Conversation, Message } from "@/types";

export const mockConversations: Conversation[] = [
  {
    _id: "conv_01",
    type: "private",
    name: "John Doe",
    avatar: "https://i.pravatar.cc",
    participants: [
      {
        _id: "p_01",
        user: {
          _id: "u1",
          name: "John Doe",
          email: "john@example.com",
          avatar: "https://i.pravatar.cc",
          isOnline: true,
          friendStatus: "friend"
        },
        role: "owner",
        joinedAt: "2024-01-01T10:00:00Z",
        lastRead: new Date().toISOString(),
        isActive: true
      }
    ],
    lastMessage: {
      content: "Alo, test WebRTC chút không?",
      sender: { _id: "u1", name: "John Doe", email: "john@dev.com", avatar: "...", isOnline: true },
      type: "text" as any,
      createdAt: new Date().toISOString(),
    },
    unreadCount: 0,
    updatedAt: new Date().toISOString(),
    createdAt: "2024-01-01T10:00:00Z",
  },
  {
    _id: "conv_02",
    type: "group",
    name: "React & WebRTC Team",
    avatar: "https://ui-avatars.com",
    participants: [
      {
        _id: "p_02",
        user: { _id: "me", name: "Me", email: "me@dev.com", avatar: "", isOnline: true },
        role: "admin",
        joinedAt: "2024-01-05T08:30:00Z",
        lastRead: new Date().toISOString(),
        isActive: true
      },
      {
        _id: "p_03",
        user: { _id: "u2", name: "Alice", email: "alice@dev.com", avatar: "...", isOnline: false },
        role: "member",
        joinedAt: "2024-01-06T08:30:00Z",
        lastRead: new Date().toISOString(),
        isActive: true
      }
    ],
    lastMessage: {
      content: "Alice đã tham gia nhóm",
      sender: { _id: "u2", name: "Alice", email: "...", avatar: "...", isOnline: false },
      type: "text" as any,
      createdAt: "2024-03-07T12:00:00Z",
    },
    unreadCount: 5,
    updatedAt: "2024-03-07T12:00:00Z",
    createdAt: "2024-01-05T08:30:00Z",
  }
];


interface ConversationState {
  conversations: Conversation[];
  activeId: string | null;
  
  // Actions
  setActiveId: (id: string | null) => void;
  setConversations: (c: Conversation[]) => void;
  addConversation: (c: Conversation) => void;
  updateConversation: (id: string, d: Partial<Conversation>) => void;
  
  // Cập nhật lastMessage và đẩy lên đầu khi có tin nhắn mới
  bumpConversation: (msg: Message) => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  conversations: mockConversations || [],
  activeId: null,

  setActiveId: (id) => set({ activeId: id }),
  setConversations: (conversations) => set({ conversations }),

  addConversation: (c) => set((s) => ({
    conversations: [c, ...s.conversations.filter((x) => x._id !== c._id)],
  })),

  updateConversation: (id, d) => set((s) => ({
    conversations: s.conversations.map((c) => (c._id === id ? { ...c, ...d } : c)),
  })),

  bumpConversation: (msg) => set((s) => {
    const cid = typeof msg.conversation === 'string' ? msg.conversation : (msg.conversation as any)._id;
    const targetIdx = s.conversations.findIndex(c => c._id === cid);
    if (targetIdx === -1) return s;

    const newConvs = [...s.conversations];
    const updated = {
      ...newConvs[targetIdx],
      lastMessage: { content: msg.content || "", sender: msg.sender, type: msg.type, createdAt: msg.createdAt },
      updatedAt: msg.createdAt
    };
    
    newConvs.splice(targetIdx, 1);
    newConvs.unshift(updated);
    return { conversations: newConvs };
  }),
}));
