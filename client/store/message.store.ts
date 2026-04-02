import { create } from "zustand";
import type { Message, Reaction } from "@/types";

interface ConversationMeta {
  hasMore: boolean;
  nextCursor: string | null;
}

interface MessageState {
  messages: Record<string, Message[]>; // CID -> Danh sách tin nhắn
  meta: Record<string, ConversationMeta>; // Trạng thái load của từng CID
  activeOrder: string[]; // Thứ tự các CID vừa truy cập (để dọn dẹp RAM)
  replyingTo: Message | null;

  // Actions chính
  setMessages: (
    cid: string,
    msgs: Message[],
    hasMore: boolean,
    nextCursor: string | null,
  ) => void;
  prependMessages: (
    cid: string,
    msgs: Message[],
    hasMore: boolean,
    nextCursor: string | null,
  ) => void;
  addMessage: (msg: Message) => void;

  // Trạng thái tin nhắn
  updateReactions: (cid: string, msgId: string, reactions: Reaction[]) => void;
  markDeleted: (cid: string, msgId: string) => void;
  markAsDelivered: (msgId: string, cid: string, tempId: string) => void;

  // UI Helpers
  setReplyingTo: (m: Message | null) => void;
  clearCache: (cid: string) => void;
  updateMessageStatus: (tempId: string, status: "failed" | "sent") => void;
}

const MAX_CONVERSATIONS_IN_RAM = 5; // Giới hạn số hội thoại lưu trong RAM

export const useMessageStore = create<MessageState>((set) => ({
  messages: {},
  meta: {},
  activeOrder: [],
  replyingTo: null,

  // 1. Load lần đầu (hoặc chuyển tab)
  setMessages: (cid, msgs, hasMore, nextCursor) =>
    set((s) => {
      const newOrder = [cid, ...s.activeOrder.filter((id) => id !== cid)];
      let newMessages = { ...s.messages, [cid]: msgs };
      let newMeta = { ...s.meta, [cid]: { hasMore, nextCursor } };
      let finalOrder = newOrder;

      // Tự động dọn dẹp nếu vượt quá giới hạn
      if (newOrder.length > MAX_CONVERSATIONS_IN_RAM) {
        const cidToRemove = newOrder[newOrder.length - 1];
        delete newMessages[cidToRemove];
        delete newMeta[cidToRemove];
        finalOrder = newOrder.slice(0, MAX_CONVERSATIONS_IN_RAM);
      }

      return { messages: newMessages, meta: newMeta, activeOrder: finalOrder };
    }),

  // 2. Load thêm tin nhắn cũ (Prepend)
  prependMessages: (cid, msgs, hasMore, nextCursor) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [cid]: [...msgs.reverse(), ...(s.messages[cid] || [])], // Tin nhắn cũ chèn vào đầu
      },
      meta: {
        ...s.meta,
        [cid]: { hasMore, nextCursor },
      },
    })),

  // 3. Nhận tin nhắn mới (Real-time hoặc gửi đi)
  addMessage: (msg) =>
    set((s) => {
      const cid =
        typeof msg.conversation === "string"
          ? msg.conversation
          : (msg.conversation as any)._id;
      const currentMsgs = s.messages[cid] || [];

      // Tránh trùng lặp (nếu socket gửi về tin nhắn mình vừa gửi)
      if (currentMsgs.find((m) => m._id === msg._id)) return s;
      const existsIndex = currentMsgs.findIndex((m) => m._id === msg.tempId);

      if (existsIndex > -1) {
        const updatedMsgs = [...currentMsgs];
        const oldMsg = updatedMsgs[existsIndex];
        updatedMsgs[existsIndex] = {
          ...oldMsg,
          _id: msg._id,
          status: "sent",
          createdAt: msg.createdAt,
        };
        return {
          messages: { ...s.messages, [cid]: updatedMsgs },
        };
      }
      return {
        messages: { ...s.messages, [cid]: [...currentMsgs, msg] },
        activeOrder: [cid, ...s.activeOrder.filter((id) => id !== cid)], // Đẩy lên đầu danh sách hoạt động
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
                deletedForEveryone: true,
                content: "Tin nhắn đã bị thu hồi",
                attachments: [],
              }
            : m,
        ),
      },
    })),

  markAsDelivered: (msgId: string, cid: string, tempId: string) =>
    set((s) => {
      // Chỉ lấy mảng tin nhắn của đúng hội thoại đó
      const conversationMessages = s.messages[cid];
      if (!conversationMessages) return s;

      const updatedMessages = conversationMessages.map((m) =>
        m._id === tempId || m._id === msgId
          ? { ...m, isDelivered: true, status: undefined }
          : m,
      );

      return {
        messages: {
          ...s.messages,
          [cid]: updatedMessages,
        },
      };
    }),

  setReplyingTo: (m) => set({ replyingTo: m }),

  clearCache: (cid) =>
    set((s) => {
      const nextMsgs = { ...s.messages };
      const nextMeta = { ...s.meta };
      delete nextMsgs[cid];
      delete nextMeta[cid];
      return {
        messages: nextMsgs,
        meta: nextMeta,
        activeOrder: s.activeOrder.filter((id) => id !== cid),
      };
    }),

  updateMessageStatus: (tempId, status) =>
    set((s) => {
      const nextMessages = { ...s.messages };
      for (const cid in nextMessages) {
        const msgs = nextMessages[cid];
        const msgIndex = msgs.findIndex(
          (m) => m._id === tempId || m.tempId === tempId,
        );
        if (msgIndex !== -1) {
          msgs[msgIndex] = { ...msgs[msgIndex], status };
          break; 
        }
      }
      return { messages: nextMessages };
    }),
}));
