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
import { useConversationStore, useMessageStore } from "@/store";
import BubbleContent from "./BubbleContent";
import { fmtTime, getStatusMessage, groupReactions } from "@/utils/chat.utils";
import { Check, Loader, ReplyIcon, TrashIcon } from "lucide-react";
import RevokedBubble from "./RevokedBubble";
import SystemMsg from "./SystemMsg";
import CallMessage from "./CallMessage";
import { getAvatar } from "@/utils/user.utils";

const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

interface Props {
  message: Message;
  isMe: boolean;
  showAvatar: boolean;
  convId: string;
  currentUserId: string;
  isLast: boolean;
  isGroup?: boolean;
}

export default function MessageBubble({
  message: m,
  isMe,
  showAvatar,
  convId,
  currentUserId,
  isLast,
  isGroup,
}: Props) {
  const setReplyingTo = useMessageStore((s) => s.setReplyingTo);
  const conv = useConversationStore((s) => s.conversations.get(convId));

  const handleReact = async (emoji: string) => {
    // try {
    //   // TODO ①: gọi API react
    //   await conversationApi.reactToMessage(convId, m._id, emoji);
    // } catch {}
  };

  const handleDelete = async () => {
    // if (!confirm("Thu hồi tin nhắn này?")) return;
    // try {
    //   // TODO ②: gọim.reactions.length  API delete
    //   await conversationApi.deleteMessage(convId, m._id, true);
    //   useMessageStore.getState().markDeleted(convId, m._id);
    // } catch {}
  };

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

        {/* Reply preview */}
        {m.replyTo && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-2xl mb-1 max-w-full overflow-hidden border-l-[3px] text-xs"
            style={{
              background: isMe ? "rgba(0,0,0,.1)" : "var(--color-s2)",
              borderColor: "var(--color-brand)",
              color: isMe ? "rgba(255,255,255,.8)" : "var(--color-ink-3)",
            }}
          >
            <span className="truncate">
              {(m.replyTo as Message).content || "Tệp đính kèm"}
            </span>
          </div>
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
                <CallMessage msg={m} isMe={isMe} />
              ) : (
                <BubbleContent message={m} isMe={isMe} />
              )}

              {/* Reactions - Đặt tuyệt đối để đè nhẹ lên mép tin nhắn */}
              {m.reactions?.length > 0 && (
                <div
                  className={`flex flex-wrap gap-1 -mt-2 relative z-10 ${
                    isMe ? "justify-end pr-2" : "pl-2"
                  }`}
                >
                  {groupReactions(m.reactions).map(({ emoji, count }) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(emoji)}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-transform hover:scale-110 active:scale-95 cursor-pointer shadow-sm border border-white/50"
                      style={{
                        background: "var(--color-s2)",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      }}
                    >
                      <span>{emoji}</span>
                      {count > 1 && (
                        <span
                          className="text-[11px]"
                          style={{ color: "var(--color-ink-2)" }}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions (hover) */}
          <div
            className={`msg-actions flex items-center gap-2 mb-1  ${isMe ? "flex-row-reverse mr-2" : "ms-2"}`}
          >
            {/* Emoji picker */}
            <div className="relative group/emoji">
              <button
                className="w-6 h-6 flex items-center justify-center rounded-full text-xs transition-all duration-300 active:scale-90 cursor-pointer"
                style={{
                  background: "var(--color-s3)",
                  color: "var(--color-ink-3)",
                }}
              >
                😊
              </button>

              {/* Emoji Picker Menu */}
              <div
                className={`absolute bottom-full ${isMe ? "right-0" : "left-0"} mb-2 z-50 
                 invisible opacity-0 group-hover/emoji:visible group-hover/emoji:opacity-100 
                 flex gap-1 p-1.5 rounded-full
                 /* Slow down entry, speed up exit */
                 transition-[opacity,transform,visibility] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] 
                 translate-y-2 group-hover/emoji:translate-y-0`}
                style={{
                  background: "white",
                  boxShadow: "var(--shadow-lg)",
                  border: "1px solid #f0f0f0",
                }}
              >
                {/* Invisible bridge - vùng đệm rộng hơn để di chuột mượt */}
                <div className="absolute -bottom-3 left-0 w-full h-3" />

                {QUICK_EMOJIS.map((e, index) => (
                  <button
                    key={e}
                    onClick={() => handleReact(e)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-lg 
                     hover:scale-130 hover:bg-slate-50 transition-all duration-200 cursor-pointer
                     /* Animation cho từng icon bay lên nhẹ nhàng */
                     opacity-0 scale-50 group-hover/emoji:opacity-100 group-hover/emoji:scale-100"
                    style={{
                      // Delay xuất hiện chậm lại một chút để tạo cảm giác mượt mà
                      transitionDelay: `${index * 40 + 50}ms`,
                      transitionTimingFunction:
                        "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Button */}
            <button
              onClick={() => setReplyingTo(m)}
              className="w-6 h-6 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-primary/10 text-slate-500 hover:text-primary cursor-pointer"
              style={{ background: "var(--color-s3)" }}
            >
              <ReplyIcon size={14} />
            </button>

            {/* Delete Button */}
            {isMe && (
              <button
                onClick={handleDelete}
                className="w-6 h-6 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-red-50 cursor-pointer"
                style={{
                  background: "var(--color-s3)",
                  color: "var(--color-danger)",
                }}
              >
                <TrashIcon className="w-3.5 h-3.5" />
              </button>
            )}
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
