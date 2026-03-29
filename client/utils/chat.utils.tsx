import { Conversation, Reaction, User, Message } from "@/types";
import { Check, CheckCheck, Loader, X } from "lucide-react";
import { JSX } from "react";

/**
 * Gets the ID of the other participant in a 1-on-1 conversation
 */
function getOtherId(c: Conversation, me: User | null): string {
  const otherParticipant = c.participants.find((p) => {
    const id = typeof p.user === "object" ? p.user._id : p.user;
    return id !== me?._id;
  });

  const userObj = otherParticipant?.user;
  return typeof userObj === "object" ? userObj._id : userObj || "";
}

/**
 * Returns the display name for a conversation
 */
function getConvName(c: Conversation, me: User | null): string {
  if (c.type === "group") return c.name || "Group Chat";

  const other = c.participants.find((p) => {
    const id = typeof p.user === "object" ? p.user._id : p.user;
    return id !== me?._id;
  });

  return (other?.user as User)?.name || "User";
}

/**
 * Returns the avatar URL for a conversation
 */
function getConvAvatar(c: Conversation, me: User | null): string | undefined {
  if (c.type === "group") return c.avatar;

  const other = c.participants.find((p) => {
    const id = typeof p.user === "object" ? p.user._id : p.user;
    return id !== me?._id;
  });

  return (other?.user as User)?.avatar;
}

/**
 * Generates a short preview string for the last message
 */
function getPreview(c: Conversation, me: User | null): string {
  const lm = c.lastMessage;
  if (!lm) return "No messages yet";

  const isMine = (lm.sender as User)?._id === me?._id;
  const prefix = isMine ? "You: " : "";
  const attachmentsLength = lm.attachments?.length || 0;
  switch (lm.type) {
    case "image":
      return `${prefix} Sent ${attachmentsLength > 0 ? attachmentsLength + " photos" : "a photo"}`;
    case "file":
      return `${prefix} Sent ${attachmentsLength > 0 ? attachmentsLength + " files" : "a file"}`;
    default:
      return prefix + (lm.content || "Sent a message");
  }
}

function getStatusMessage(m: Message): {label: string; icon: JSX.Element} {
  if (m.status === "failed") return { label: "Failed to send", icon: <X size={14} /> };
  if (m.status === "sending") return { label: "Sending...", icon: <Loader className="animate-spin" size={14} /> };
  if (m.isDelivered) return { label: "Delivered", icon: <CheckCheck size={14} /> };
  return { label: "Sent", icon: <Check size={14} /> };
}

/**
 * Formats ISO date string into a human-readable relative time
 */
function fmtTime(iso?: string | Date): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffInSecs = (now.getTime() - d.getTime()) / 1000;

  if (diffInSecs < 60) return "Just now";

  if (diffInSecs < 3600) {
    const mins = Math.floor(diffInSecs / 60);
    return `${mins}m ago`;
  }

  // If today: 14:30
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  // If this year: 12/05
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" });
  }

  // If older: 2023/12/05
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Checks if two dates are on the same calendar day
 */
function sameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

/**
 * Aggregates reactions by emoji type
 */
function groupReactions(reactions: Reaction[]) {
  const map: Record<string, number> = {};
  reactions.forEach((r) => {
    map[r.emoji] = (map[r.emoji] || 0) + 1;
  });
  return Object.entries(map).map(([emoji, count]) => ({ emoji, count }));
}

/**
 * Formats file size from bytes to human-readable units
 */
function fmtSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export {
  fmtTime,
  getPreview,
  getConvAvatar,
  getConvName,
  getOtherId,
  sameDay,
  fmtSize,
  groupReactions,
  getStatusMessage,
};
