import { PhoneIncoming } from "lucide-react";

const ConnectingScreen = () => {
  return (
    <div className="fixed inset-0 bg-[#0a0a0f] z-100 flex flex-col items-center justify-center gap-6">
      <div className="relative flex items-center justify-center">
        <span className="absolute h-28 w-28 rounded-full bg-indigo-500/10 animate-ping" />
        <span className="absolute h-20 w-20 rounded-full bg-indigo-500/15" />
        <div className="relative flex items-center justify-center h-16 w-16 rounded-[20px] bg-[#111118] border border-white/6 shadow-xl shadow-black/40">
          <PhoneIncoming className="w-7 h-7 text-indigo-400" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold text-white tracking-tight">
          Establishing connection…
        </h2>
        <p className="text-sm text-white/40">Please wait a moment</p>
      </div>

      <div className="w-36 h-0.5 rounded-full bg-white/8 overflow-hidden">
        <div className="h-full w-1/2 rounded-full bg-indigo-500 animate-[slide_1.4s_ease-in-out_infinite]" />
      </div>

      <style>{`
          @keyframes slide {
            0%   { transform: translateX(-100%); }
            50%  { transform: translateX(100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
    </div>
  );
};

export default ConnectingScreen;
