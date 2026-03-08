import { Message } from "@/types";
import { Phone, Video, PhoneOff, PhoneMissed, RotateCcw } from "lucide-react";

export default function CallMessage({
  msg,
  isMe,
}: {
  msg: Message;
  isMe: boolean;
}) {
  const { callType, status, duration } = msg.callData || {};
    console.log(msg)
  const getCallConfig = () => {
    const isVideo = callType === "video";
    const typeLabel = isVideo ? "Video call" : "Audio call";

    switch (status) {
      case "ended":
        return {
          icon: isVideo ? <Video size={18} /> : <Phone size={18} />,
          title: `${typeLabel} ended`,
          detail: `${Math.floor(duration! / 60)}:${(duration! % 60).toString().padStart(2, "0")}`,
          showCallback: true,
        };
      case "missed":
        return {
          icon: <PhoneMissed size={18} className="text-red-500" />,
          title: isMe
            ? `You missed a ${typeLabel.toLowerCase()}`
            : `Missed ${typeLabel.toLowerCase()}`,
          detail: "Tap to call back",
          showCallback: !isMe,
        };
      case "rejected":
        return {
          icon: <PhoneOff size={18} />,
          title: isMe ? "Call declined" : "Declined your call",
          detail: null,
          showCallback: true,
        };
      default:
        return {
          icon: null,
          title: msg.content,
          detail: null,
          showCallback: false,
        };
    }
  };

  const config = getCallConfig();

  return (
    <div
      className={`text-nowrap flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
    >

      {/* Message Bubble */}
      <div
        className={`rounded-2xl p-3  text-white ${
          isMe ? "bg-blue-600 " : "bg-gray"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full text-primary ${isMe ? "bg-white" : "bg-gray-100"}`}
          >
            {config.icon}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-[14px]">{config.title}</span>
            {config.detail && (
              <span
                className={`text-[12px] ${isMe ? "text-gray-200" : "text-gray-400"}`}
              >
                {config.detail}
              </span>
            )}
          </div>
        </div>

        {/* Callback Button */}
        {config.showCallback && (
          <button
            onClick={() => console.log("Redialing...")}
            className={`mt-2 w-full flex items-center justify-center gap-1 py-1.5 rounded-lg shadow-lg cursor-pointer text-[13px] font-semibold transition-colors ${
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
