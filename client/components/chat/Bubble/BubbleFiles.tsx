import { Attachment } from "@/types";
import { fmtSize } from "@/utils/chat.utils";
import { DownloadIcon, FileIcon } from "lucide-react";

export default function BubbleFiles({
  files,
  isMe,
  bubbleBase,
}: {
  files: Attachment[];
  isMe: boolean;
  bubbleBase: React.CSSProperties;
}) {
  return (
    <div style={{ ...bubbleBase, padding: "10px 14px" }}>
      {files.map((file) => (
        <div key={file.url} className="flex items-center gap-3 mb-1 last:mb-0">
          <div
            className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0"
            style={{
              background: isMe ? "rgba(255,255,255,.2)" : "var(--color-s2)",
            }}
          >
            <FileIcon className={`w-5 h-5 ${!isMe ? "text-primary" : "text-white"}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate max-w-40">{file.name}</p>
            <p className="text-xs opacity-70">{fmtSize(file.size)}</p>
          </div>
          <a
            href={file.url}
            download
            target="_blank"
            className="shrink-0 opacity-70 hover:opacity-100"
          >
            <DownloadIcon className="w-4 h-4" />
          </a>
        </div>
      ))}
    </div>
  );
}