"use client";
import type { Message, User } from "@/types";
import { useConversationStore } from "@/store";
import BubbleContent from "./BubbleContent";
import { fmtTime, getStatusMessage } from "@/utils/chat.utils";
import { Loader } from "lucide-react";
import RevokedBubble from "./RevokedBubble";
import SystemMsg from "./SystemMsg";
import CallMessage from "./CallMessage";
import { getAvatar } from "@/utils/user.utils";

interface Props {
  message: Message;
  isMe: boolean;
  showAvatar: boolean;
  convId: string;
  currentUserId: string;
  isLast: boolean;
  isGroup?: boolean;
  onStartCall?: (type: "audio" | "video") => Promise<void>;
}

export default function MessageBubble({
  message: m,
  isMe,
  showAvatar,
  convId,
  currentUserId,
  isLast,
  isGroup,
  onStartCall,
}: Props) {
  const conv = useConversationStore((s) => s.conversations.get(convId));
  if (m.type === "system") {
    return <SystemMsg text={m.content || ""} />;
  }

  return (
    <div
      className={`msg-row flex gap-2 items-start mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar — chỉ hiện cho tin nhắn người khác trong nhóm */}
      <div
        className={`shrink-0 flex flex-col justify-end  ${!isMe ? "w-8" : ""}`}
      >
        {showAvatar && !isMe && (
          <img
            src={getAvatar(m.sender as User)}
            alt={m.sender.name}
            className="w-8 h-8 rounded-full object-cover bg-gray-300"
          />
        )}
      </div>

      <div
        className={`flex flex-col max-w-[65%] ${isMe ? "items-end" : "items-start"}`}
      >
        {/* Sender name in group */}
        {isGroup && !isMe && showAvatar && (
          <span className="text-xs font-semibold mb-1 px-1 text-white!">
            {m.sender.name}
          </span>
        )}

        {/* Bubble + actions */}
        <div
          className={`group relative flex gap-1 items-end ${isMe ? "flex-row-reverse" : "flex-row"}`}
        >
          {/* Content bubble */}
          <div>
            <div className="relative">
              {m.isDeletedForAll ? (
                <RevokedBubble isMe={isMe} />
              ) : m.type === "audio" || m.type === "video" ? (
                <CallMessage msg={m} isMe={isMe} onStartCall={onStartCall} />
              ) : (
                <BubbleContent message={m} isMe={isMe} />
              )}
            </div>
          </div>
        </div>

        {/* Time + seen — TODO ④ seen từ socket event */}
        <div
          className={`flex items-center gap-1 mt-0.5 text-[11px] px-1 text-gray-400 ${isMe ? "flex-row-reverse" : ""}`}
        >
          {m.status === "sending" ? (
            <>
              <p>Sending</p>
              <Loader className="animate-spin" size={14} />
            </>
          ) : (
            <>
              {/* Phần hiển thị trạng thái tin nhắn */}
              <div className="flex items-center justify-end mt-1 space-x-1">
                {(isGroup || isMe) && isLast && (
                  <div className="flex flex-col items-end gap-1 mt-1">
                    {(() => {
                      // 1. Lấy danh sách những người (không phải mình) đã đọc đến tin nhắn này
                      const seenUsers =
                        conv?.participants.filter((p) => {
                          const isNotMe = p.user._id !== currentUserId;
                          const hasReadThis =
                            new Date(p.lastRead) >= new Date(m.createdAt);

                          return isNotMe && hasReadThis;
                        }) || [];

                      if (seenUsers.length > 0) {
                        return (
                          <>
                            <div className="flex -space-x-1.5 items-center">
                              {seenUsers.slice(-3).map((p) => {
                                if (m.sender._id === p.user._id) {
                                  return null; // Không hiển thị avatar của người gửi nếu họ đã đọc tin nhắn của chính mình
                                }
                                return (
                                  <img
                                    key={p.user._id}
                                    src={getAvatar(p.user)}
                                    alt="seen"
                                    className="w-4 h-4 rounded-full object-cover"
                                    title={`Seen by ${p.user.name} at ${fmtTime(p.lastRead)}`}
                                  />
                                );
                              })}
                              {seenUsers.length > 3 && (
                                <span className="text-[9px] text-gray-500 ml-1">
                                  +{seenUsers.length - 3}
                                </span>
                              )}
                            </div>
                          </>
                        );
                      }

                      /* 2. Nếu CHƯA có ai xem: Hiện trạng thái Sending/Sent/Delivered */
                      const status = getStatusMessage(m);
                      return (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400">
                          {status.icon}
                          <span>
                            {status.label} &bull; {fmtTime(m.createdAt)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
