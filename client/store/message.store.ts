import { create } from "zustand";
import type { Message, Reaction } from "@/types";

const mockMessages: Record<string, Message[]> = {
  conv_01: [
    {
      _id: "msg_01",
      conversation: "conv_02",
      sender: {
        _id: "user_01",
        name: "Nguyễn Văn A",
        avatar: "a.jpg",
        isOnline: true,
        email: "de",
      },
      type: "text",
      content: "Chào buổi sáng cả nhà! ☀️",
      reactions: [{ user: "user_02", emoji: "👍" }],
      seenBy: [{ user: "user_02", seenAt: "2024-03-07T08:05:00Z" }],
      isDeletedForAll: false,
      createdAt: "2024-03-07T08:00:00Z",
      updatedAt: "2024-03-07T08:00:00Z",
    },
    {
      _id: "msg_02",
      conversation: "conv_02",
      sender: {
        _id: "69a968b95eb8896e8bca350f",
        name: "Nguyễn Văn A",
        avatar: "a.jpg",
        isOnline: true,
        email: "de",
      },
      seenBy: [{ user: "user_02", seenAt: "2024-03-07T08:05:00Z" }],

      type: "call",
      callData: {
        duration: 125, // 2 phút 5 giây
        status: "ended",
        callType: "audio",
      },
      reactions: [],
      isDeletedForAll: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: "msg_03",
      conversation: "conv_02",
      sender: {
        _id: "user_01",
        name: "Nguyễn Văn A",
        avatar: "a.jpg",
        isOnline: true,
        email: "de",
      },
      type: "call",
      callData: {
        duration: 0,
        status: "missed",
        callType: "video",
      },
      reactions: [],
      seenBy: [],
      isDeletedForAll: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  conv_02: [
    {
      _id: "msg_01",
      conversation: "conv_02",
      sender: {
        _id: "user_01",
        name: "Nguyễn Văn A",
        avatar: "a.jpg",
        isOnline: true,
        email: "de",
      },
      type: "text",
      content: "Chào buổi sáng cả nhà! ☀️",
      reactions: [{ user: "user_02", emoji: "👍" }],
      seenBy: [{ user: "user_02", seenAt: "2024-03-07T08:05:00Z" }],
      isDeletedForAll: false,
      createdAt: "2024-03-07T08:00:00Z",
      updatedAt: "2024-03-07T08:00:00Z",
    },
    {
      _id: "msg_02",
      conversation: "conv_02",
      sender: {
        _id: "user_02",
        name: "Trần Thị B",
        avatar: "b.jpg",
        isOnline: true,
        email: "de",
      },
      type: "image",
      attachments: [
        {
          url: "https://example.com",
          filename: "photo.jpg",
          mimetype: "image",
          size: 123,
        },
      ],
      replyTo: null,
      reactions: [],
      seenBy: [],
      isDeletedForAll: false,
      createdAt: "2024-03-07T08:10:00Z",
      updatedAt: "2024-03-07T08:10:00Z",
    },
    {
      _id: "msg_03",
      conversation: "conv_02",
      sender: {
        _id: "69a968b95eb8896e8bca350f",
        name: "Duy phan",
        avatar: "",
        isOnline: true,
        email: "de",
      },
      type: "text",
      content: "Chào dell gì!",
      reactions: [],
      seenBy: [{ user: "user_02", seenAt: "2024-03-07T08:05:00Z" }],
      isDeletedForAll: false,
      createdAt: "2024-03-07T08:00:00Z",
      updatedAt: "2024-03-07T08:00:00Z",
    },
  ],
};

interface MessageState {
  messages: Record<string, Message[]>; // CID -> Message[]
  replyingTo: Message | null;

  // Actions
  setMessages: (cid: string, msgs: Message[]) => void;
  addMessage: (msg: Message) => void;
  updateReactions: (cid: string, msgId: string, reactions: Reaction[]) => void;
  markDeleted: (cid: string, msgId: string) => void;
  markSeen: (
    cid: string,
    msgId: string,
    seen: { user: string; seenAt: string },
  ) => void;
  setReplyingTo: (m: Message | null) => void;
  clearCache: (cid: string) => void; // Giải phóng RAM khi cần
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: mockMessages || {},
  replyingTo: null,
  setMessages: (cid, msgs) =>
    set((s) => ({
      messages: { ...s.messages, [cid]: msgs },
    })),

  addMessage: (msg) =>
    set((s) => {
      const cid =
        typeof msg.conversation === "string"
          ? msg.conversation
          : (msg.conversation as any)._id;
      return {
        messages: { ...s.messages, [cid]: [...(s.messages[cid] || []), msg] },
      };
    }),

  updateReactions: (cid, msgId, reactions) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [cid]: (s.messages[cid] || []).map((m) =>
          m._id === msgId ? { ...m, reactions } : m,
        ),
      },
    })),

  markDeleted: (cid, msgId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [cid]: (s.messages[cid] || []).map((m) =>
          m._id === msgId
            ? {
                ...m,
                isDeletedForAll: true,
                content: "Tin nhắn đã thu hồi",
                attachments: [],
              }
            : m,
        ),
      },
    })),

  markSeen: (cid, msgId, seen) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [cid]: (s.messages[cid] || []).map((m) =>
          m._id === msgId ? { ...m, seenBy: [...(m.seenBy || []), seen] } : m,
        ),
      },
    })),

  setReplyingTo: (m) => set({ replyingTo: m }),
  clearCache: (cid) =>
    set((s) => {
      const next = { ...s.messages };
      delete next[cid];
      return { messages: next };
    }),
}));
