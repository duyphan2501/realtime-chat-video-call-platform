import { Conversation, Reaction, User } from "@/types";

function getOtherId(c: Conversation, me: User | null): string {
  return (
    c.participants.find((p) => {
      const id = typeof p.user === "object" ? p.user._id : p.user;
      return id !== me?._id;
    })?.user?._id ?? ""
  );
}

function getConvName(c: Conversation, me: User | null): string {
  if (c.type === "group") return c.name || "Nhóm chat";
  const other = c.participants.find((p) => {
    const id = typeof p.user === "object" ? p.user._id : p.user;
    return id !== me?._id;
  });
  return (other?.user as User)?.name || "Người dùng";
}

function getConvAvatar(c: Conversation, me: User | null): string | undefined {
  if (c.type === "group") return c.avatar;
  const other = c.participants.find((p) => {
    const id = typeof p.user === "object" ? p.user._id : p.user;
    return id !== me?._id;
  });
  return (other?.user as User)?.avatar;
}

function getPreview(c: Conversation, me: User | null): string {
  const lm = c.lastMessage;
  if (!lm) return "Chưa có tin nhắn";
  const isMine = (lm.sender as User)?._id === me?._id;
  const prefix = isMine ? "Bạn: " : "";
  if (lm.type === "image") return prefix + "📷 Hình ảnh";
  if (lm.type === "file") return prefix + "📎 Tệp đính kèm";
  if (lm.type === "video") return prefix + "📹 Video";
  return prefix + (lm.content || "");
}

function fmtTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const secs = (now.getTime() - d.getTime()) / 1000;
  if (secs < 60) return "Vừa xong";
  if (secs < 3600) return `${Math.floor(secs / 60)} phút`;
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

function groupReactions(reactions: Reaction[]) {
  const map: Record<string, number> = {};
  reactions.forEach((r) => {
    map[r.emoji] = (map[r.emoji] || 0) + 1;
  });
  return Object.entries(map).map(([emoji, count]) => ({ emoji, count }));
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
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
};
