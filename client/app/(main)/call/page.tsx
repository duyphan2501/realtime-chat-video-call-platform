"use client";

import { useState } from "react";
import {
  Video,
  ScreenShare,
  Settings,
  BarChart2,
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  MonitorUp,
  MoreHorizontal,
  PhoneOff,
  FlipHorizontal,
} from "lucide-react";
import ControlButton from "@/components/ControlButton";

export default function VideoCall() {
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [showIncoming, setShowIncoming] = useState(true);
  const [message, setMessage] = useState("");

  return (
    <div className="bg-[#0a0a0f] font-sans text-white overflow-hidden h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-2 rounded-lg text-primary">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-white text-base font-semibold leading-tight flex items-center gap-2">
              Call with Sarah Jenkins
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500 border border-emerald-500/20">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </h1>
            <p className="text-[#9d9db9] text-xs font-medium mt-0.5">
              04:22 · Secure Connection
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center rounded-xl h-10 w-10 bg-[#161625] hover:bg-gray transition-colors border border-white/5">
            <ScreenShare className="w-5 h-5" />
          </button>
          <button className="flex items-center justify-center rounded-xl h-10 w-10 bg-[#161625] hover:bg-gray transition-colors border border-white/5">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 overflow-hidden relative">
        {/* Video Area */}
        <div className="flex-1 relative bg-[#050508] flex items-center justify-center p-6">
          <div className="relative w-full h-full max-w-6xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#161625] group">
            {/* Remote video */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{
                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuACDrmrA9zop2NjdmpBRwRz6xCiQqhHUpr60CFMyFyzW_6c2Y9KhqkGZWtnIbmQtHdJ9RcyYwVWpLBCbYzFOj3o04uakps6IlNGdDWSrqCKRLTJwhI-VPBkTs9bQIRB2t3gRrEXMAiEHzwDP4b6F5Oj4_dCMlfl6RhPz_oAK-mu9lFfiFlQcd9z5BMoss2-tcmMWUDgPO9HPctElrOgQpRz6RMkBMoi2LSJSMTmLZJl1QlEmstRAjGAiNinK2t7BgUz2_-xk-WByStH")`,
              }}
            />
            <div className="absolute top-6 right-6 w-48 aspect-video bg-[#161625] rounded-2xl overflow-hidden border-2 border-primary/50 shadow-2xl group/pip cursor-move ring-4 ring-black/20">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuBLmeH_rOjOjKAtHXon_aplYbh6vUdQzHz7uuHg9qw6D0riMzuCk1Vzlp2RUy7KtmvffI0KlsyELhsuBYr0-3mORILFfVDAhMkBbp9lRK8xl62uXbSV4RZokLxQu5TX6j0Xj8j2Vc7oc0B4BMPzZV5CDM3BywFCyb8IxxVII_0LJvO5U1vaw_kzWVZGwRXSGe1dJs8ZnXWNi0_f-486SCrzPS-1a-9mjrlvIV1TOZuCVaKQyu1CRGSGDPB9EPeZUcNdPxXQTpxruabM")`,
                }}
              />
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                You
              </div>
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/pip:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm">
                  <FlipHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Control Bar */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#161625]/90 backdrop-blur-2xl px-8 py-5 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <ControlButton
              icon={
                muted ? (
                  <MicOff className="w-6 h-6" />
                ) : (
                  <Mic className="w-6 h-6" />
                )
              }
              active={muted}
              label=""
              onClick={() => setMuted(!muted)}
            />
            <ControlButton
              icon={
                cameraOff ? (
                  <VideoOff className="w-6 h-6" />
                ) : (
                  <VideoIcon className="w-6 h-6" />
                )
              }
              active={cameraOff}
              label=""
              onClick={() => setCameraOff(!cameraOff)}
            />
            <div className="flex flex-col items-center gap-1 group">
              <button className="flex items-center justify-center rounded-2xl h-14 px-8 bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/20">
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
