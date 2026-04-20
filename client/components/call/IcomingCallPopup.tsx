"use client";

import { useState, useEffect, useRef } from "react";
import {
  VideoIcon,
  PhoneOffIcon,
  VolumeXIcon,
  BanIcon,
  MessageSquareIcon,
  Loader2,
} from "lucide-react";
import { useCallStore, useConversationStore, useSocketStore } from "@/store";
import { useRingCountdown, useWebRTC } from "@/hooks";
import { useCallService } from "@/services";
import { CallStatus } from "@/types";
import { getAvatar } from "@/utils/user.utils";

// Waiting time before auto-decline (seconds)
const RING_TIMEOUT_SECONDS = 30;

export default function IncomingCallPopup() {
  const { status, setStatus, incoming } = useCallStore.getState();
  const { acceptCall, endCall } = useWebRTC();
  const socket = useSocketStore((s) => s.socket);
  const activeId = useConversationStore((s) => s.activeId);
  const { rejectCall } = useCallService();

  // Local state: track permission-requesting phase
  const [isAccepting, setIsAccepting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Countdown timer state
  const timeLeft = useRingCountdown(30);
  const autoDeclineFiredRef = useRef(false);

  // Calculate remaining percentage for SVG circle
  const progress = timeLeft / RING_TIMEOUT_SECONDS; // 1 → 0
  const radius = 58; // SVG circle radius (px)
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Color changes according to remaining time
  const ringColor =
    timeLeft > 15
      ? "#6366f1" // indigo
      : timeLeft > 8
        ? "#f59e0b" // amber
        : "#ef4444"; // red

  const handleAccept = async () => {
    if (status !== "ringing" || isAccepting) return;

    setIsAccepting(true);
    setPermissionError(null);

    try {
      await acceptCall();
    } catch (err: any) {
      const isPermissionDenied =
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError";

      setPermissionError(
        isPermissionDenied
          ? "Camera/microphone access was denied. Please allow access and try again."
          : "Could not access camera or microphone. Please check your devices.",
      );
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (status !== "ringing") return;
    await rejectCall("rejected");
    useCallStore.getState().reset();
  };

  // Auto-decline when time runs out
  const handleAutoDecline = () => {
    if (useCallStore.getState().status !== "ringing") return;
    useCallStore.getState().reset();
  };

  useEffect(() => {
    if (timeLeft === 0 && status === "ringing") handleAutoDecline();
  }, [timeLeft]);

  // Separate: when timeLeft reaches 0, trigger auto-decline AFTER render completes
  useEffect(() => {
    if (timeLeft === 0 && !autoDeclineFiredRef.current) {
      autoDeclineFiredRef.current = true;
      handleAutoDecline();
    }
  }, [timeLeft]);

  // Reset local state if popup closes
  useEffect(() => {
    if (status !== "ringing") {
      setIsAccepting(false);
      setPermissionError(null);
    }
  }, [status]);

  useEffect(() => {
    if (["ended", "rejected", "missed", "busy"].includes(status)) {
      const t = setTimeout(() => setStatus("idle"), 3000);
      return () => clearTimeout(t);
    }
  }, [status, setStatus]);

  if (status !== "ringing" && status !== "busy") return null;

  const statusLabel: Partial<Record<CallStatus, string>> = {
    ringing: "Incoming Video Call...",
    calling: "Calling...",
    accepted: "Connecting...",
    connected: "Connected",
    rejected: "Call Rejected",
    ended: "Call Ended",
    missed: "Missed Call",
    busy: "User is busy",
  };

  const labelColor: Partial<Record<CallStatus, string>> = {
    ringing: "text-indigo-400 animate-pulse",
    calling: "text-indigo-400 animate-pulse",
    accepted: "text-green-500 animate-pulse",
    connected: "text-green-500",
    rejected: "text-red-500",
    ended: "text-slate-400",
    missed: "text-amber-500",
    busy: "text-amber-500",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#111118] border border-white/6 rounded-[28px] shadow-2xl shadow-black/60 overflow-hidden">
        {/* Avatar with countdown ring */}
        <div className="flex justify-center pt-10">
          <div className="relative size-28">
            {/* Ping animations */}
            {status === "ringing" && (
              <>
                <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping [animation-duration:1.5s]" />
                <span className="absolute inset-0 scale-110 rounded-full bg-indigo-500/10" />
                <span className="absolute inset-0 scale-125 rounded-full bg-indigo-500/5 animate-ping [animation-duration:2s] [animation-delay:0.3s]" />
              </>
            )}

            {/* SVG countdown ring — located above avatar, outside the border */}
            {status === "ringing" && (
              <svg
                className="absolute -inset-2.5 z-20 size-[calc(100%+20px)] -rotate-90"
                viewBox="0 0 136 136"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Track */}
                <circle
                  cx="68"
                  cy="68"
                  r={radius}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="3"
                />
                {/* Progress */}
                <circle
                  cx="68"
                  cy="68"
                  r={radius}
                  stroke={ringColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{
                    transition: "stroke-dashoffset 1s linear, stroke 0.5s ease",
                  }}
                />
              </svg>
            )}

            <img
              src={getAvatar({name: incoming?.from.name || "User", avatar: incoming?.from.avatar})}
              alt={incoming?.from.name}
              className="relative z-10 size-28 rounded-full object-cover border-4 border-[#111118] shadow-xl"
            />
            <span className="absolute bottom-0 right-0 z-20 bg-indigo-500 text-white p-1.5 rounded-full border-2 border-[#111118]">
              <VideoIcon size={13} />
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col items-center px-8 pt-5 pb-2">
          <h3 className="text-xl font-semibold tracking-tight text-white">
            {incoming?.from.name}
          </h3>
          <p
            className={`text-sm font-medium mt-1 ${labelColor[status] ?? "text-slate-400"}`}
          >
            {statusLabel[status] ?? ""}
          </p>

          {/* Countdown text */}
          {status === "ringing" && (
            <p
              className={`text-xs mt-1.5 font-mono tabular-nums transition-colors duration-500 ${
                timeLeft > 15
                  ? "text-white/25"
                  : timeLeft > 8
                    ? "text-amber-400/70"
                    : "text-red-400/80 animate-pulse"
              }`}
            >
              Auto-decline in {timeLeft}s
            </p>
          )}
        </div>

        {/* Permission error banner */}
        {permissionError && (
          <div className="mx-6 mt-3 px-4 py-3 rounded-[14px] bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center leading-relaxed">
            {permissionError}
          </div>
        )}

        {/* Accept / Decline or Close */}
        {status === "ringing" ? (
          <div className="flex gap-4 px-8 pt-5 pb-4">
            {/* Decline */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <button
                onClick={handleDecline}
                disabled={status !== "ringing" || isAccepting}
                className="size-14 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PhoneOffIcon size={24} />
              </button>
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                Decline
              </span>
            </div>

            {/* Accept */}
            <div className="flex-1 flex flex-col items-center gap-2">
              <button
                onClick={handleAccept}
                disabled={status !== "ringing" || isAccepting}
                className="size-14 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed relative"
              >
                {isAccepting ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <VideoIcon size={24} />
                )}
              </button>
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                {isAccepting ? "Connecting…" : "Accept"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center px-8 pt-5 pb-4">
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => useCallStore.getState().reset()}
                className="size-14 rounded-full bg-slate-500/10 text-slate-400 flex items-center justify-center hover:bg-slate-500 hover:text-white transition-colors duration-200"
              >
                <BanIcon size={24} />
              </button>
              <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                Close
              </span>
            </div>
          </div>
        )}

        {/* Permission hint — only show when requesting permission */}
        {isAccepting && !permissionError && (
          <div className="mx-6 mb-4 px-4 py-3 rounded-[14px] bg-indigo-500/8 border border-indigo-500/15 text-indigo-300/70 text-xs text-center leading-relaxed">
            Allow camera & microphone access in your browser to continue
          </div>
        )}

        {/* Quick message */}
        {status === "ringing" && (
          <div className="px-6 pb-5">
            <div className="flex items-center justify-between p-4 rounded-[18px] bg-white/4 border border-white/6">
              <div>
                <p className="text-white text-[13px] font-semibold">
                  Can't talk right now?
                </p>
                <p className="text-white/35 text-xs mt-0.5">
                  Send a quick message instead
                </p>
              </div>
              <button
                onClick={() => {}}
                disabled={status !== "ringing" || isAccepting}
                className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold py-2 px-3 rounded-[10px] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MessageSquareIcon size={12} />
                Message
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {status === "ringing" && (
          <div className="border-t border-white/6 py-3 px-6 flex justify-center gap-8">
            {[
              {
                icon: <VolumeXIcon size={15} />,
                label: "Mute",
                handleClick: () => {},
              },
              {
                icon: <BanIcon size={15} />,
                label: "Ignore",
                handleClick: () => {
                  useCallStore.getState().reset();
                },
              },
            ].map(({ icon, label, handleClick }) => (
              <button
                key={label}
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-indigo-400 transition-colors"
                onClick={handleClick}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
