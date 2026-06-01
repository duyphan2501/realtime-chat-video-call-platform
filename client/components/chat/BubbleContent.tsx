import { useState } from "react";
import { Message } from "@/types";
import BubbleImages from "./Bubble/BubbleImages";
import BubbleFiles from "./Bubble/BubbleFiles";
import BubbleText from "./Bubble/BubbleText";
import Lightbox from "./Lightbox";

export default function BubbleContent({
  message: m,
  isMe,
}: {
  message: Message;
  isMe: boolean;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const bubbleBase: React.CSSProperties = {
    borderRadius: isMe ? "14px 14px 0px 14px" : "14px 14px 14px 0px",
    maxWidth: "100%",
    wordBreak: "break-word",
    background: isMe ? "var(--color-brand)" : "var(--color-gray)",
    color: "white",
    boxShadow: "var(--shadow-xs)",
    width: "fit-content",
  };

  const attachments = m.attachments?.filter((a) => a?.url) ?? [];
  const imgs = attachments.filter((a) => a.type?.startsWith("image/"));
  const files =
    attachments.filter((a) => !a.type?.startsWith("image/")) ?? [];

  return (
    <>
      <div
        className={`flex max-w-full flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}
      >
        {imgs.length > 0 && (
          <BubbleImages imgs={imgs} onClickIndex={setLightboxIndex} />
        )}

        {files.length > 0 && (
          <BubbleFiles files={files} isMe={isMe} bubbleBase={bubbleBase} />
        )}

        {!!m.content && (
          <BubbleText content={m.content} bubbleBase={bubbleBase} />
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          imgs={imgs}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  );
}
