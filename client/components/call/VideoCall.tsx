"use client";

import { useEffect, useRef, useState } from "react";
import {
  Video,
  ScreenShare,
  Settings,
  Mic,
  MicOff,
  VideoIcon,
  VideoOff,
  PhoneOff,
  Loader2,
} from "lucide-react";
import ControlButton from "@/components/ControlButton";
import { useCallStore, useConversationStore, useSocketStore } from "@/store";
import { useRingCountdown, useWebRTC } from "@/hooks";
import ConnectingScreen from "./ConnectingScreen";
import EndedScreen from "./EndedScreen";
import { formatTime } from "@/utils/call.utils";
import { CallStatus } from "@/types";
import { useCallService } from "@/services";

export default function VideoCall() {
  // ── Store (reactive — use selector to only re-render when correct field changes)
  const status = useCallStore((s) => s.status);
  const callType = useCallStore((s) => s.callType);
  const peerUser = useCallStore((s) => s.peerUser);
  const localStream = useCallStore((s) => s.localStream);
  const remoteStream = useCallStore((s) => s.remoteStream);
  const isMuted = useCallStore((s) => s.isMuted);
  const isCamOff = useCallStore((s) => s.isCamOff);
  const toggleMute = useCallStore((s) => s.toggleMute);
  const toggleCam = useCallStore((s) => s.toggleCam);
  const startTime = useCallStore((s) => s.startTime);

  // getState() — only use for values read in event handler (no need reactive)
  const { endCall } = useWebRTC();
  const socket = useSocketStore((s) => s.socket);

  const [duration, setDuration] = useState(0);
  const waitTimeLeft = useRingCountdown(30);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const endedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { endCall: endCallAPI, rejectCall } = useCallService();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (endedTimerRef.current) clearTimeout(endedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (waitTimeLeft === 0 && !remoteStream) {
      const { role } = useCallStore.getState();
      if (role === "caller") {
        handleTerminateCall({ reason: "missed" });
      }
    }
  }, [waitTimeLeft]);

  // ── Assign remote stream to video element
  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el || !remoteStream) return;
    el.srcObject = remoteStream;
    return () => {
      if (el.srcObject === remoteStream) el.srcObject = null;
    };
  }, [remoteStream, status]);

  // ── Assign local stream to video element
  useEffect(() => {
    const el = localVideoRef.current;
    if (!el || !localStream) return;
    el.srcObject = localStream;
    return () => {
      if (el.srcObject === localStream) el.srcObject = null;
    };
  }, [localStream, status]);

  // ── Sync audio track with isMuted
  useEffect(() => {
    localStream?.getAudioTracks().forEach((t) => {
      t.enabled = !isMuted;
    });
  }, [isMuted, localStream, status]);

  // ── Sync video track with isCamOff
  useEffect(() => {
    localStream?.getVideoTracks().forEach((t) => {
      t.enabled = !isCamOff;
    });
  }, [isCamOff, localStream, status]);

  const handleTerminateCall = async ({
    reason = "ended",
  }: {
    reason: CallStatus;
  }) => {
    const { setStatus, reset, callType } = useCallStore.getState();

    if (!callType) return;

    setStatus(reason);

    try {
      if (reason === "ended") {
        await endCallAPI();
      } else {
        await rejectCall(reason);
      }
    } catch (error) {
      console.error("Failed to terminate call:", error);
    }

    if (endedTimerRef.current) clearTimeout(endedTimerRef.current);
    endedTimerRef.current = setTimeout(() => {
      reset();
      endedTimerRef.current = null;
    }, 2000);
  };

  const handleEndCall = () => {
    if (duration === 0) handleTerminateCall({ reason: "missed" });
    else handleTerminateCall({ reason: "ended" });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (startTime && status === "calling") {
      interval = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        setDuration(seconds);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [startTime, status]);

  // ── Render guards ────────────────────────────────────────────────────────────

  if (status === "connecting") {
    return <ConnectingScreen />;
  }

  if (status === "ended" || status === "rejected" || status === "missed") {
    return <EndedScreen status={status} />;
  }

  if (status !== "calling" && status !== "connected") return null;

  // ── Active call UI ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0f] text-white overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-5 h-15 border-b border-white/6 bg-[#0a0a0f]/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-9 w-9 rounded-[14px] bg-[#111118] border border-white/6">
            <Video className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div className="leading-none">
            <p className="text-[13px] font-semibold text-white flex items-center gap-2">
              Call with {peerUser?.name}
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </p>
            <p className="text-[11px] text-white/50 mt-0.5">
              {formatTime(duration)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(
            [
              <ScreenShare className="w-4 h-4" />,
              <Settings className="w-4 h-4" />,
            ] as const
          ).map((icon, i) => (
            <button
              key={i}
              className="flex items-center justify-center h-9 w-9 rounded-[14px] bg-[#111118] border border-white/6 text-white/50 hover:text-white hover:bg-white/8 transition-colors"
            >
              {icon}
            </button>
          ))}
        </div>
      </header>

      {/* Video stage */}
      <main className="flex-1 relative bg-[#050508] p-4 flex items-center justify-center">
        {/* Remote video card */}
        <div className="relative w-full h-full max-w-6xl rounded-[28px] overflow-hidden border border-white/6 bg-[#111118] shadow-2xl shadow-black/60">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Waiting for remote stream */}
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#111118]">
              <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-[#1a1a2a] border border-white/6">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              </div>
              <p className="text-[13px] text-white/35">
                Waiting for remote video…
              </p>
              <p className="text-[11px] text-white/25">
                Auto-cancel in {waitTimeLeft}s
              </p>
            </div>
          )}

          {/* PiP — local video */}
          <div className="absolute top-4 right-4 w-44 aspect-video rounded-[20px] overflow-hidden border border-white/10 bg-[#111118] shadow-xl shadow-black/50 z-20">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Overlay when no stream yet */}
            {!localStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#111118] px-3 text-center">
                <VideoOff className="w-5 h-5 text-white/20" />
                <p className="text-[9px] text-white/25 leading-snug">
                  Camera unavailable
                </p>
              </div>
            )}

            {/* Overlay khi cam off */}
            {isCamOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#111118] z-10">
                <VideoOff className="w-5 h-5 text-white/20" />
              </div>
            )}

            <span className="absolute bottom-2 left-2 z-20 rounded-full bg-black/55 px-2 py-0.5 text-[9px] font-semibold tracking-widest text-white/70">
              YOU
            </span>
          </div>
        </div>

        {/* Control bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-[#111118]/90 backdrop-blur-2xl px-6 py-4 rounded-[28px] border border-white/6 shadow-2xl shadow-black/50">
          <ControlButton
            icon={<Mic className="w-5 h-5" />}
            activeIcon={<MicOff className="w-5 h-5" />}
            active={isMuted}
            onClick={toggleMute}
            label={isMuted ? "Unmute" : "Mute"}
          />
          <ControlButton
            icon={<VideoIcon className="w-5 h-5" />}
            activeIcon={<VideoOff className="w-5 h-5" />}
            active={isCamOff}
            onClick={toggleCam}
            label={isCamOff ? "Start Camera" : "Stop Camera"}
          />

          <div className="h-full w-px bg-white/8 mx-1" />

          <ControlButton
            icon={<PhoneOff className="w-5 h-5" />}
            onClick={handleEndCall}
            label="End call"
            variant="danger"
          />
        </div>
      </main>
    </div>
  );
}
