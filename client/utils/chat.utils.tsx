import { Conversation, Reaction, User, Message, TypingUser } from "@/types";
import { Ban, Check, CheckCheck, Loader } from "lucide-react";
import { JSX } from "react";
import { Phone, Video, PhoneOff, PhoneMissed, RotateCcw } from "lucide-react";

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

const getCallConfig = (msg: Message, isMe: boolean) => {
  if (!msg.callData) return {title: "Invalid Call"};
  const {duration, status} = msg.callData;
  const isVideo = msg.type === "video";
  const typeLabel = isVideo ? "video call" : "voice call";

  // helper để viết hoa chữ cái đầu
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  switch (status) {
    case "ended":
      return {
        icon: isVideo ? <Video size={18} /> : <Phone size={18} />,
        title: `${capitalize(typeLabel)} ended`,
        detail: duration
          ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, "0")}`
          : "0:00",
        showCallback: true,
      };

    case "missed":
      return {
        icon: <PhoneMissed size={18} className="text-red-500" />,
        // Nếu là mình gọi: "No answer" (Không ai nhấc máy)
        // Nếu là người kia gọi: "Missed call" (Cuộc gọi nhỡ)
        title: isMe
          ? `No answer from your ${typeLabel}`
          : `Missed ${typeLabel}`,
        detail: null,
        showCallback: true,
      };

    case "rejected":
      return {
        icon: <PhoneOff size={18} className="text-gray-500" />,
        // Nếu là mình gọi: "Call declined" (Người kia từ chối)
        // Nếu là người kia gọi: "You declined" (Bạn đã từ chối)
        title: isMe
          ? `Declined your ${typeLabel}`
          : `You declined the ${typeLabel}`,
        detail: null,
        showCallback: true,
      };

    case "no_answer": // Thêm case này nếu server trả về khi timeout
      return {
        icon: <PhoneMissed size={18} />,
        title: `Your ${typeLabel} was not answered`,
        detail: null,
        showCallback: true,
      };

    default:
      return {
        icon: isVideo ? <Video size={18} /> : <Phone size={18} />,
        title: msg.content || "Outgoing call",
        detail: null,
        showCallback: false,
      };
  }
};

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
      return `${prefix} Sent ${attachmentsLength > 1 ? attachmentsLength + " photos" : "a photo"}`;
    case "file":
      return `${prefix} Sent ${attachmentsLength > 1 ? attachmentsLength + " files" : "a file"}`;
    case "video":
      return getCallConfig(c.lastMessage as Message, me?._id === c.lastMessage?.sender._id)?.title;
    default:
      return prefix + (lm.content || "Sent a message");
  }
}

function getStatusMessage(m: Message): { label: string; icon: JSX.Element } {
  if (m.status === "failed")
    return { label: "Failed to send", icon: <Ban size={14} /> };
  if (m.status === "sending")
    return {
      label: "Sending...",
      icon: <Loader className="animate-spin" size={14} />,
    };
  if (m.isDelivered)
    return { label: "Delivered", icon: <CheckCheck size={14} /> };
  return { label: "Sent", icon: <Check size={14} /> };
}

/**
 * Formats ISO date string into a human-readable relative time
 */
function fmtTime(iso?: string | Date): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();

  // Tính toán khoảng cách thời gian
  const diffInSecs = Math.floor((now.getTime() - d.getTime()) / 1000);

  // Reset về 00:00:00 để tính số ngày chính xác (tránh lỗi lệch múi giờ)
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffInDays = Math.floor(
    (nowDate.getTime() - dDate.getTime()) / (1000 * 3600 * 24),
  );

  // 1. Dưới 1 phút: vừa xong
  if (diffInSecs < 60) return "just now";

  // 2. Dưới 1 giờ: số phút trước
  if (diffInSecs < 3600) {
    const mins = Math.floor(diffInSecs / 60);
    return `${mins}m ago`;
  }

  // 3. Trong ngày hôm nay: 14:30
  if (diffInDays === 0) {
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  // 4. Hôm qua: Yesterday
  if (diffInDays === 1) return "Yesterday";

  // 5. Từ 2 đến 7 ngày trước: 2d ago, 3d ago...
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  // 6. Trong cùng năm: 12/05
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
    });
  }

  // 7. Khác năm: 12/05/2023
  return d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
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

const getTypingText = (users: TypingUser[]) => {
  if (users.length === 0) return "";
  if (users.length === 1) return `${users[0].name} is typing`;
  if (users.length === 2)
    return `${users[0].name} and ${users[1].name} are typing`;
  return `${users[0].name}, ${users[1].name} and ${users.length - 2} others are typing`;
};

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
  getTypingText,
  getCallConfig,
};
