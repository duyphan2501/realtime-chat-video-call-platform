import { create } from "zustand";
import type { Message, Reaction } from "@/types";

interface ConversationMeta {
  hasMore: boolean;
  nextCursor: string | null;
}

interface MessageState {
  messages: Record<string, Message[]>; // CID -> List of messages
  meta: Record<string, ConversationMeta>; // Load state of each CID
  activeOrder: string[]; // Order of recently accessed CIDs (for RAM cleanup)
  replyingTo: Message | null;

  // Main actions
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

  // Message status
  updateReactions: (cid: string, msgId: string, reactions: Reaction[]) => void;
  markDeleted: (cid: string, msgId: string) => void;
  markAsDelivered: (msgId: string, cid: string, tempId: string) => void;

  // UI Helpers
  setReplyingTo: (m: Message | null) => void;
  clearCache: (cid: string) => void;
  updateMessageStatus: (tempId: string, status: "failed" | "sent") => void;
}

const MAX_CONVERSATIONS_IN_RAM = 5; // Limit number of conversations stored in RAM

const isValidMessage = (message: unknown): message is Message =>
  !!message &&
  typeof message === "object" &&
  typeof (message as { _id?: unknown })._id === "string";

export const useMessageStore = create<MessageState>((set) => ({
  messages: {},
  meta: {},
  activeOrder: [],
  replyingTo: null,

  // 1. Load first time (or switch tab)
  setMessages: (cid, msgs, hasMore, nextCursor) =>
    set((s) => {
      const newOrder = [cid, ...s.activeOrder.filter((id) => id !== cid)];
      const newMessages = { ...s.messages, [cid]: msgs.filter(isValidMessage) };
      const newMeta = { ...s.meta, [cid]: { hasMore, nextCursor } };
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

  // 2. Load more old messages (Prepend)
  prependMessages: (cid, msgs, hasMore, nextCursor) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [cid]: [
          ...msgs.filter(isValidMessage).reverse(),
          ...(s.messages[cid] || []),
        ], // Old messages inserted at the beginning
      },
      meta: {
        ...s.meta,
        [cid]: { hasMore, nextCursor },
      },
    })),

  // 3. Receive new message (real-time or sent)
  addMessage: (msg) =>
    set((s) => {
      if (!isValidMessage(msg)) return s;
      const cid =
        typeof msg.conversation === "string"
          ? msg.conversation
          : (msg.conversation as { _id?: string })?._id;
      if (!cid) return s;
      const currentMsgs = s.messages[cid] || [];

      // Avoid duplicates (if socket sends back message just sent)
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
        activeOrder: [cid, ...s.activeOrder.filter((id) => id !== cid)], // Push to top of active list
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
                content: "Message has been recalled",
                attachments: [],
              }
            : m,
        ),
      },
    })),

  markAsDelivered: (msgId: string, cid: string, tempId: string) =>
    set((s) => {
      // Only get message array of the correct conversation
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
