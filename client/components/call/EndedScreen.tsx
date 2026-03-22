import { useWebRTC } from "@/hooks";
import { useCallStore } from "@/store";
import { CallStatus } from "@/types";
import { PhoneOff } from "lucide-react";

const EndedScreen = ({ status }: { status: CallStatus }) => {
  const endCall = useWebRTC().endCall;
  return (
    <div className="fixed inset-0 bg-[#0a0a0f] z-100 flex flex-col items-center justify-center gap-4">
      <div className="flex items-center justify-center h-16 w-16 rounded-[20px] bg-[#111118] border border-white/6 shadow-xl shadow-black/40">
        <PhoneOff className="w-7 h-7 text-red-400" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-white tracking-tight capitalize">
          Call {status}
        </h2>
        <p className="text-sm text-white/40">Thank you for using my app</p>
        <button
          onClick={() => {
            endCall();
            useCallStore.getState().reset();
          }}
          className="mt-1 py-2 px-5 rounded-[14px] bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all text-white text-sm font-semibold"
        >
          Return to Chat
        </button>
      </div>
    </div>
  );
};

export default EndedScreen;
