import { Message } from "@/types";
import { fmtSize } from "@/utils/chat.utils";
import { DownloadIcon, FileIcon } from "lucide-react";

/* ── Bubble content ──────────────────────────────── */
export default function BubbleContent({ message: m, isMe }: { message: Message; isMe: boolean }) {
  const bubbleBase: React.CSSProperties = {
    borderRadius:       isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    padding:            "8px 12px",
    maxWidth:           "100%",
    wordBreak:          "break-word",
    background:         isMe ? "var(--color-brand)" : "var(--color-gray)",
    color:              "white",
    boxShadow:          "var(--shadow-xs)",
  };

  /* Text */
  if (m.type === "text" || !m.attachments?.length) {
    return (
      <div style={bubbleBase}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
      </div>
    );
  }

  /* Images */
  if (m.attachments?.some((a) => a.mimetype.startsWith("image/"))) {
    const imgs = m.attachments.filter((a) => a.mimetype.startsWith("image/"));
    return (
      <div className="overflow-hidden rounded-2xl" style={{ boxShadow: "var(--shadow-xs)" }}>
        <div className={`grid gap-1 ${imgs.length === 1 ? "grid-cols-1" : imgs.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {imgs.map((img) => (
            <img
              key={img.url}
              src={img.url}
              alt={img.filename}
              className="object-cover aspect-square w-full"
              style={{ maxWidth: 240 }}
            />
          ))}
        </div>
        {m.content && (
          <div style={{ ...bubbleBase, borderRadius: 0 }}>
            <p className="text-sm">{m.content}</p>
          </div>
        )}
      </div>
    );
  }

  /* File */
  return (
    <div style={{ ...bubbleBase, padding: "10px 14px" }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0 text-primary"
          style={{ background: isMe ? "rgba(255,255,255,.2)" : "var(--color-s2)" }}>
          <FileIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate max-w-40">{m.attachments[0].filename}</p>
          <p className="text-xs opacity-70">{fmtSize(m.attachments[0].size)}</p>
        </div>
        <a href={m.attachments[0].url} download target="_blank" className="shrink-0 opacity-70 hover:opacity-100">
          <DownloadIcon className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}