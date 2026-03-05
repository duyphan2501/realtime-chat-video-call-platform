/* ═══════════════════════════════════════════════════════════
   store/index.ts  —  Zustand global state
   Stores này chỉ giữ state UI + cache dữ liệu từ server.
   Không gọi API trực tiếp ở đây.
   ═══════════════════════════════════════════════════════════ */
import { create } from "zustand";
import type {
  Conversation, Message, User, Reaction, Participant,
  CallStatus, CallType, IncomingCall,
} from "@/types";
import type { Socket } from "socket.io-client";

/* ── Chat Store ─────────────────────────────────── */
interface TypingUser { _id: string; fullName: string; avatar: string; }

interface ChatStore {
  conversations:     Conversation[];
  setConversations:  (c: Conversation[]) => void;
  addConversation:   (c: Conversation)   => void;
  updateConversation:(id: string, d: Partial<Conversation>) => void;
  removeConversation:(id: string) => void;
  updateParticipants:(id: string, p: Participant[]) => void;

  activeId:    string | null;
  setActiveId: (id: string | null) => void;

  messages:           Record<string, Message[]>;
  setMessages:        (cid: string, msgs: Message[]) => void;
  prependMessages:    (cid: string, msgs: Message[]) => void;
  addMessage:         (msg: Message)  => void;
  updateReactions:    (msgId: string, reactions: Reaction[]) => void;
  markDeleted:        (msgId: string) => void;
  markSeen:           (cid: string, msgId: string, seen: { userId: string; seenAt: string }) => void;

  typingUsers: Record<string, TypingUser[]>;
  setTyping:   (cid: string, user: TypingUser)  => void;
  clearTyping: (cid: string, userId: string)    => void;

  onlineUsers:    Set<string>;
  setOnline:      (userId: string, v: boolean)  => void;

  friendRequests:       User[];
  addFriendRequest:     (u: User)   => void;
  removeFriendRequest:  (id: string) => void;

  replyingTo:    Message | null;
  setReplyingTo: (m: Message | null) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  setConversations:  (c)      => set({ conversations: c }),
  addConversation:   (c)      => set((s) => ({
    conversations: [c, ...s.conversations.filter((x) => x._id !== c._id)],
  })),
  updateConversation: (id, d) => set((s) => ({
    conversations: s.conversations.map((c) => c._id === id ? { ...c, ...d } : c),
  })),
  removeConversation: (id)    => set((s) => ({
    conversations: s.conversations.filter((c) => c._id !== id),
  })),
  updateParticipants: (id, p) => set((s) => ({
    conversations: s.conversations.map((c) => c._id === id ? { ...c, participants: p } : c),
  })),

  activeId:    null,
  setActiveId: (id) => set({ activeId: id }),

  messages: {},
  setMessages: (cid, msgs) => set((s) => ({ messages: { ...s.messages, [cid]: msgs } })),
  prependMessages: (cid, msgs) => set((s) => ({
    messages: { ...s.messages, [cid]: [...msgs, ...(s.messages[cid] || [])] },
  })),
  addMessage: (msg) => {
    const cid = msg.conversation as string;
    set((s) => ({
      messages: { ...s.messages, [cid]: [...(s.messages[cid] || []), msg] },
      conversations: s.conversations
        .map((c) => c._id === cid
          ? { ...c, lastMessage: { content: msg.content || "", sender: msg.sender, type: msg.type, createdAt: msg.createdAt }, updatedAt: msg.createdAt }
          : c)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    }));
  },
  updateReactions: (msgId, reactions) => set((s) => {
    const next = { ...s.messages };
    for (const cid in next)
      next[cid] = next[cid].map((m) => m._id === msgId ? { ...m, reactions } : m);
    return { messages: next };
  }),
  markDeleted: (msgId) => set((s) => {
    const next = { ...s.messages };
    for (const cid in next)
      next[cid] = next[cid].map((m) =>
        m._id === msgId ? { ...m, isDeletedForAll: true, content: "Tin nhắn đã bị thu hồi", attachments: [] } : m
      );
    return { messages: next };
  }),
  markSeen: (cid, msgId, seen) => set((s) => ({
    messages: {
      ...s.messages,
      [cid]: (s.messages[cid] || []).map((m) =>
        m._id === msgId ? { ...m, seenBy: [...m.seenBy, { user: seen.userId, seenAt: seen.seenAt }] } : m
      ),
    },
  })),

  typingUsers: {},
  setTyping:   (cid, user) => set((s) => {
    const cur = s.typingUsers[cid] || [];
    if (cur.find((u) => u._id === user._id)) return s;
    return { typingUsers: { ...s.typingUsers, [cid]: [...cur, user] } };
  }),
  clearTyping: (cid, userId) => set((s) => ({
    typingUsers: { ...s.typingUsers, [cid]: (s.typingUsers[cid] || []).filter((u) => u._id !== userId) },
  })),

  onlineUsers: new Set(),
  setOnline: (userId, v) => set((s) => {
    const next = new Set(s.onlineUsers);
    v ? next.add(userId) : next.delete(userId);
    return { onlineUsers: next };
  }),

  friendRequests:       [],
  addFriendRequest:     (u)  => set((s) => ({
    friendRequests: s.friendRequests.find((x) => x._id === u._id)
      ? s.friendRequests : [...s.friendRequests, u],
  })),
  removeFriendRequest: (id) => set((s) => ({
    friendRequests: s.friendRequests.filter((u) => u._id !== id),
  })),

  replyingTo:    null,
  setReplyingTo: (m) => set({ replyingTo: m }),
}));

/* ── Socket Store ───────────────────────────────── */
interface SocketStore {
  socket:       Socket | null;
  isConnected:  boolean;
  setSocket:    (s: Socket | null) => void;
  setConnected: (v: boolean) => void;
}

export const useSocketStore = create<SocketStore>((set) => ({
  socket:       null,
  isConnected:  false,
  setSocket:    (socket)      => set({ socket }),
  setConnected: (isConnected) => set({ isConnected }),
}));

/* ── Call Store ─────────────────────────────────── */
interface CallStore {
  status:       CallStatus;
  callType:     CallType | null;
  incoming:     IncomingCall | null;
  peerSocketId: string | null;
  convId:       string | null;
  isMuted:      boolean;
  isCamOff:     boolean;
  startTime:    number | null;

  setStatus:       (s: CallStatus)         => void;
  setCallType:     (t: CallType | null)    => void;
  setIncoming:     (c: IncomingCall|null)  => void;
  setPeer:         (id: string | null)     => void;
  setConvId:       (id: string | null)     => void;
  toggleMute:      () => void;
  toggleCam:       () => void;
  setStartTime:    (t: number | null)      => void;
  reset:           () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  status: "idle", callType: null, incoming: null, peerSocketId: null,
  convId: null, isMuted: false, isCamOff: false, startTime: null,

  setStatus:    (status)      => set({ status }),
  setCallType:  (callType)    => set({ callType }),
  setIncoming:  (incoming)    => set({ incoming }),
  setPeer:      (peerSocketId)=> set({ peerSocketId }),
  setConvId:    (convId)      => set({ convId }),
  toggleMute:   ()            => set((s) => ({ isMuted:  !s.isMuted })),
  toggleCam:    ()            => set((s) => ({ isCamOff: !s.isCamOff })),
  setStartTime: (startTime)   => set({ startTime }),
  reset: () => set({
    status: "idle", callType: null, incoming: null, peerSocketId: null,
    convId: null, isMuted: false, isCamOff: false, startTime: null,
  }),
}));
