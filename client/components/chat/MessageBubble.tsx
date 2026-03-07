/* ═══════════════════════════════════════════════════════════
   components/chat/MessageBubble.tsx

   TODO — backend:
   ① React: conversationApi.reactToMessage()
   ② Delete: conversationApi.deleteMessage()
   ③ Reply: setReplyingTo() trong store (chỉ UI, không gọi API)
   ④ Seen: server push "message:seen" event qua socket
   ═══════════════════════════════════════════════════════════ */
"use client";
import type { Message, User, Reaction } from "@/types";
import { conversationApi } from "@/lib/api";
import { useConversationStore, useMessageStore } from "@/store";

const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

interface Props {
  message:    Message;
  isMe:       boolean;
  showAvatar: boolean;
  convId:     string;
  isGroup?:   boolean;
}

export default function MessageBubble({ message: m, isMe, showAvatar, convId, isGroup }: Props) {
  const setReplyingTo = useMessageStore((s) => s.setReplyingTo);

  if (m.isDeletedForAll) return <RevokedBubble isMe={isMe} />;
  if (m.type === "system") return <SystemMsg text={m.content || ""} />;

  const handleReact = async (emoji: string) => {
    try {
      // TODO ①: gọi API react
      await conversationApi.reactToMessage(convId, m._id, emoji);
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirm("Thu hồi tin nhắn này?")) return;
    try {
      // TODO ②: gọi API delete
      await conversationApi.deleteMessage(convId, m._id, true);
      useMessageStore.getState().markDeleted(convId, m._id);
    } catch {}
  };

  return (
    <div className={`msg-row flex gap-2 items-end mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar — chỉ hiện cho tin nhắn người khác trong nhóm */}
      <div className="w-8 h-8 shrink-0">
        {showAvatar && !isMe && (
          <img
            src={m.sender.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.sender.name)}&size=32&background=e3e8f0&color=0068FF&bold=true`}
            alt={m.sender.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
      </div>

      <div className={`flex flex-col max-w-[65%] ${isMe ? "items-end" : "items-start"}`}>
        {/* Sender name in group */}
        {isGroup && !isMe && showAvatar && (
          <span className="text-xs font-semibold mb-1 px-1" style={{ color: "var(--color-brand)" }}>
            {m.sender.name}
          </span>
        )}

        {/* Reply preview */}
        {m.replyTo && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-2xl mb-1 max-w-full overflow-hidden border-l-[3px] text-xs"
            style={{
              background:   isMe ? "rgba(0,0,0,.1)" : "var(--color-s2)",
              borderColor:  "var(--color-brand)",
              color:        isMe ? "rgba(255,255,255,.8)" : "var(--color-ink-3)",
            }}
          >
            <span className="truncate">{(m.replyTo as Message).content || "Tệp đính kèm"}</span>
          </div>
        )}

        {/* Bubble + actions */}
        <div className={`group relative flex gap-1 items-end ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          {/* Actions (hover) */}
          <div className={`msg-actions flex items-center gap-0.5 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
            {/* Emoji picker */}
            <div className="relative group/emoji">
              <button
                className="w-6 h-6 flex items-center justify-center rounded-full text-xs transition-colors"
                style={{ background: "var(--color-s3)", color: "var(--color-ink-3)" }}
              >
                😊
              </button>
              <div className="absolute bottom-8 left-0 z-50 hidden group-hover/emoji:flex gap-1 p-2 rounded-2xl shadow-lg"
                style={{ background: "white", boxShadow: "var(--shadow-lg)" }}>
                {QUICK_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => handleReact(e)}
                    className="w-7 h-7 flex items-center justify-center rounded-xl text-base hover:scale-125 transition-transform"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply — TODO ③ */}
            <button
              onClick={() => setReplyingTo(m)}
              className="w-6 h-6 flex items-center justify-center rounded-full transition-colors"
              style={{ background: "var(--color-s3)", color: "var(--color-ink-3)" }}
            >
              <ReplyIcon className="w-3 h-3" />
            </button>

            {/* Delete (chỉ tin của mình) */}
            {isMe && (
              <button
                onClick={handleDelete}
                className="w-6 h-6 flex items-center justify-center rounded-full transition-colors"
                style={{ background: "var(--color-s3)", color: "var(--color-danger)" }}
              >
                <TrashIcon className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Content bubble */}
          <div>
            <BubbleContent message={m} isMe={isMe} />

            {/* Reactions */}
            {m.reactions.length > 0 && (
              <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? "justify-end" : ""}`}>
                {groupReactions(m.reactions).map(({ emoji, count }) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs"
                    style={{ background: "var(--color-s2)", border: "1px solid var(--color-s3)" }}
                  >
                    {emoji} {count > 1 && <span style={{ color: "var(--color-ink-3)" }}>{count}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Time + seen — TODO ④ seen từ socket event */}
        <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
          <span className="text-[11px]" style={{ color: "var(--color-ink-4)" }}>
            {fmtTime(m.createdAt)}
          </span>
          {isMe && (
            <span style={{ color: m.seenBy.length > 0 ? "var(--color-brand)" : "var(--color-ink-4)" }}>
              {m.seenBy.length > 0 ? <SeenIcon /> : <SentIcon />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Bubble content ──────────────────────────────── */
function BubbleContent({ message: m, isMe }: { message: Message; isMe: boolean }) {
  const bubbleBase: React.CSSProperties = {
    borderRadius:       isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    padding:            "8px 12px",
    maxWidth:           "100%",
    wordBreak:          "break-word",
    background:         isMe ? "var(--color-brand)" : "var(--color-surface)",
    color:              isMe ? "white" : "var(--color-ink)",
    boxShadow:          "var(--shadow-xs)",
    border:             isMe ? "none" : "1px solid var(--color-s3)",
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
        <div className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0"
          style={{ background: isMe ? "rgba(255,255,255,.2)" : "var(--color-s2)" }}>
          <FileIcon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate max-w-[160px]">{m.attachments[0].filename}</p>
          <p className="text-xs opacity-70">{fmtSize(m.attachments[0].size)}</p>
        </div>
        <a href={m.attachments[0].url} download target="_blank" className="shrink-0 opacity-70 hover:opacity-100">
          <DownloadIcon className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

function RevokedBubble({ isMe }: { isMe: boolean }) {
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1 pl-10`}>
      <div className="text-xs italic px-4 py-2 rounded-2xl"
        style={{ background: "var(--color-s2)", color: "var(--color-ink-4)", border: "1px solid var(--color-s3)" }}>
        ↩ Tin nhắn đã bị thu hồi
      </div>
    </div>
  );
}

function SystemMsg({ text }: { text: string }) {
  return (
    <div className="text-center my-2">
      <span className="text-xs px-3 py-1 rounded-full"
        style={{ background: "var(--color-s3)", color: "var(--color-ink-3)" }}>
        {text}
      </span>
    </div>
  );
}

/* ── Utils ───────────────────────────────────────── */
function groupReactions(reactions: Reaction[]) {
  const map: Record<string, number> = {};
  reactions.forEach((r) => { map[r.emoji] = (map[r.emoji] || 0) + 1; });
  return Object.entries(map).map(([emoji, count]) => ({ emoji, count }));
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}
function fmtSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

/* ── Icons ───────────────────────────────────────── */
const ReplyIcon    = ({ className }: { className: string }) => <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>;
const TrashIcon    = ({ className }: { className: string }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/></svg>;
const FileIcon     = ({ className }: { className: string }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/></svg>;
const DownloadIcon = ({ className }: { className: string }) => <svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/></svg>;
const SeenIcon = () => <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM6.7 9.29L9 11.6l4.3-4.3 1.4 1.42L9 14.4l-3.7-3.7 1.4-1.42z"/></svg>;
const SentIcon = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M5 13l4 4L19 7"/></svg>;
