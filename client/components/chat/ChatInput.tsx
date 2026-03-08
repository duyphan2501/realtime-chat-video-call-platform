/* ═══════════════════════════════════════════════════════════
   components/chat/ChatInput.tsx

   TODO — backend:
   ① onSend: conversationApi.sendMessage() — đã xử lý ở ChatWindow
   ② Typing: emits qua useTyping hook — đã nối socket
   ③ File upload: files được pass qua onSend, backend dùng multer
   ═══════════════════════════════════════════════════════════ */
"use client";
import { useState, useRef, useCallback } from "react";
import { useMessageStore } from "@/store";
import { useTyping } from "@/hooks/useTyping";
import IconBtn from "../IconBtn";

interface Props {
  convId: string;
  // TODO ①: callback này được implement ở ChatWindow
  onSend: (content: string, files: File[], replyTo?: string) => Promise<void>;
  disabled?: boolean;
}

export default function ChatInput({ convId, onSend, disabled }: Props) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { startTyping, stopTyping } = useTyping(convId); // TODO ②
  const replyingTo = useMessageStore((s) => s.replyingTo);
  const setReplyTo = useMessageStore((s) => s.setReplyingTo);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      startTyping(); // TODO ②: socket emit
      const ta = e.target;
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    },
    [startTyping],
  );

  const handleSend = async () => {
    const t = text.trim();
    if (!t && !files.length) return;
    setSending(true);
    stopTyping();
    setText("");
    setFiles([]);
    setReplyTo(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    try {
      // TODO ①: được implement tại ChatWindow.handleSend
      await onSend(t, files, replyingTo?._id);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addFiles = (incoming: File[]) =>
    setFiles((prev) => [...prev, ...incoming]);

  return (
    <div className="bg-dark-secondary">
      {/* Reply bar */}
      {replyingTo && (
        <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-800">
          <div className="w-0.5 h-8 rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold text-white"
            >
              {replyingTo.sender.name}
            </p>
            <p
              className="text-xs truncate text-gray-400"
            >
              {replyingTo.content || "Tệp đính kèm"}
            </p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="shrink-0 cursor-pointer hover:text-white"
            style={{ color: "var(--color-ink-4)" }}
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div
          className="flex gap-2 px-4 py-2 overflow-x-auto"
          style={{ borderBottom: "1px solid var(--color-s3)" }}
        >
          {files.map((f, i) => (
            <div key={i} className="relative shrink-0 group">
              {f.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-xl flex flex-col items-center justify-center gap-1"
                  style={{
                    background: "var(--color-s2)",
                    border: "1px solid var(--color-s3)",
                  }}
                >
                  <FileIcon
                    className="w-5 h-5"
                    style={{ color: "var(--color-brand)" }}
                  />
                  <span
                    className="text-[9px] text-center truncate w-12 px-1"
                    style={{ color: "var(--color-ink-3)" }}
                  >
                    {f.name}
                  </span>
                </div>
              )}
              <button
                onClick={() =>
                  setFiles((prev) => prev.filter((_, j) => j !== i))
                }
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white hidden group-hover:flex items-center justify-center text-[10px]"
                style={{ background: "var(--color-danger)" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2 px-3 py-2 border-gray-800 border-t">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 shrink-0 pb-1">
          <IconBtn title="Emoji" onClick={() => {}}>
            😊
          </IconBtn>
          <IconBtn title="Hình ảnh" onClick={() => imgRef.current?.click()}>
            <ImageIcon className="w-5 h-5" />
          </IconBtn>
          <IconBtn title="Tệp" onClick={() => fileRef.current?.click()}>
            <AttachIcon className="w-5 h-5" />
          </IconBtn>
        </div>

        {/* Textarea */}
        <div className="flex-1 flex items-center">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKey}
            onBlur={stopTyping}
            disabled={disabled || sending}
            placeholder="Type somthing..."
            className="w-full resize-none px-4 py-2.5 text-sm outline-none border-gray-700 text-white border-x"
            style={{
              lineHeight: 1.5,
            }}
          />
        </div>

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !files.length) || sending}
          className="shrink-0 w-10 h-10 mb-0.5 rounded-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
          style={{
            background:
              text.trim() || files.length
                ? "var(--color-brand)"
                : "var(--color-s3)",
          }}
        >
          {sending ? (
            <SpinIcon className="w-4 h-4 text-white animate-spin" />
          ) : text.trim() || files.length ? (
            <SendIcon className="w-4 h-4 text-white" />
          ) : (
            <ThumbsIcon
              className="w-5 h-5"
              style={{ color: "var(--color-ink-3)" }}
            />
          )}
        </button>

        {/* Hidden file inputs */}
        <input
          ref={imgRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(Array.from(e.target.files || []))}
        />
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => addFiles(Array.from(e.target.files || []))}
        />
      </div>
    </div>
  );
}

/* ── Icons ───────────────────────────────────────── */
const CloseIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const SendIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);
const SpinIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);
const ImageIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);
const AttachIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
    />
  </svg>
);
const FileIcon = ({
  className,
  style,
}: {
  className: string;
  style?: React.CSSProperties;
}) => (
  <svg
    className={className}
    style={style}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path
      fillRule="evenodd"
      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
      clipRule="evenodd"
    />
  </svg>
);
const ThumbsIcon = ({
  className,
  style,
}: {
  className: string;
  style?: React.CSSProperties;
}) => (
  <svg
    className={className}
    style={style}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
  </svg>
);
