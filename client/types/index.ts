/* ─────────────────────────────────────────────────────
   TYPES — chỉ là shape dữ liệu, không chứa logic gọi API
   ───────────────────────────────────────────────────── */

export interface User {
  _id: string;
  name: string;
  email?: string;
  avatar: string;
  phone?: string;
  bio?: string;
  lastSeen?: string;
  /** "friend" | "sent" | "received" | "none" — backend trả về */
  friendStatus?: "friend" | "sent" | "received" | "none";
}

export type MessageType =
  | "text"
  | "image"
  | "file"
  | "system"
  | "audio"
  | "video";

export interface Attachment {
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  thumbnail?: string;
}

export interface Reaction {
  user: string | User;
  emoji: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  type: MessageType;
  content?: string;
  attachments?: Attachment[];
  replyTo?: Message | null;
  reactions: Reaction[];
  seenBy: { user: string; seenAt: string }[];
  isDeletedForAll: boolean;
  callData?: { duration: number; status: string; callType: string };
  createdAt: string;
  updatedAt: string;
}

export type ConversationType = "direct" | "group";

export interface Participant {
  _id: string;
  user: User;
  nickname?: string;
  role: "member" | "admin" | "owner";
  joinedAt: string;
  lastRead: string;
  isActive: boolean;
}

export interface Conversation {
  _id: string;
  type: ConversationType;
  participants: Participant[];
  name?: string;
  avatar?: string;
  lastMessage?: {
    content: string;
    sender: User;
    type: MessageType;
    createdAt: string;
    deletedForEveryone?: boolean;
  };
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
}

export type CallType = "audio" | "video";
export type CallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "connecting"
  | "connected"
  | "accepted"
  | "ended"
  | "missed"
  | "rejected";

export interface IncomingCall {
  from: { _id: string; name: string; avatar: string };
  offer: RTCSessionDescriptionInit;
}

export interface TypingUser {
  _id: string;
  fullName: string;
  avatar: string;
}
