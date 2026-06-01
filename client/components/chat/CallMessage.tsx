import { Message } from "@/types";
import { getCallConfig } from "@/utils/chat.utils";
import { Phone, Video, PhoneOff, PhoneMissed, RotateCcw } from "lucide-react";

export default function CallMessage({
  msg,
  isMe,
  onStartCall,
}: {
  msg: Message;
  isMe: boolean;
  onStartCall?: (type: "audio" | "video") => Promise<void>;
}) {
  const config = getCallConfig(msg, isMe);
  const callType: "audio" | "video" = msg.type === "video" ? "video" : "audio";

  const handleCallBack = async () => {
    try {
      if (onStartCall) {
        await onStartCall(callType);
      }
    } catch (error) {
      console.error("Failed to initiate call:", error);
    }
  };

  return (
    <div
      className={`flex max-w-full items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Message Bubble */}
      <div
        className={`max-w-full rounded-2xl p-3 text-white ${
          isMe ? "bg-blue-600 " : "bg-gray"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`shrink-0 rounded-full p-2 text-primary ${isMe ? "bg-white" : "bg-gray-100"}`}
          >
            {config.icon}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[14px] font-medium">
              {config.title}
            </span>
            {config.detail && (
              <span
                className={`truncate text-[12px] ${isMe ? "text-gray-200" : "text-gray-400"}`}
              >
                {config.detail}
              </span>
            )}
          </div>
        </div>

        {/* Callback Button */}
        {config.showCallback && (
          <button
            onClick={handleCallBack}
            disabled={!onStartCall}
            className={`mt-2 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg shadow-lg cursor-pointer text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isMe
                ? " hover:bg-gray-300 bg-gray-200 active:bg-gray-100 text-gray-700"
                : " hover:bg-primary/30 active:bg-primary/40 text-blue-600  bg-primary/10"
            }`}
          >
            <RotateCcw size={14} />
            Call Back
          </button>
        )}
      </div>
    </div>
  );
}
