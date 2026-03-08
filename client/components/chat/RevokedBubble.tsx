export default function RevokedBubble({ isMe }: { isMe: boolean }) {
  return (
    <div
      className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1 pl-10`}
    >
      <div
        className="text-xs italic px-4 py-2 rounded-2xl"
        style={{
          background: "var(--color-s2)",
          color: "var(--color-ink-4)",
          border: "1px solid var(--color-s3)",
        }}
      >
        ↩ Tin nhắn đã bị thu hồi
      </div>
    </div>
  );
}
