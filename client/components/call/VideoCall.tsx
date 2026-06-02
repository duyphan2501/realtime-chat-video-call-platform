"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { useCallStore } from "@/store";
import { useRingCountdown, useWebRTC } from "@/hooks";
import ConnectingScreen from "./ConnectingScreen";
import EndedScreen from "./EndedScreen";
import { formatTime } from "@/utils/call.utils";
import { CallStatus } from "@/types";
import { useCallService } from "@/services";

export default function VideoCall() {
  // ── Store (reactive — use selector to only re-render when correct field changes)
  const status = useCallStore((s) => s.status);
  const peerUser = useCallStore((s) => s.peerUser);
  const localStream = useCallStore((s) => s.localStream);
  const remoteStream = useCallStore((s) => s.remoteStream);
  const isMuted = useCallStore((s) => s.isMuted);
  const isCamOff = useCallStore((s) => s.isCamOff);
  const isCameraUnavailable = useCallStore((s) => s.isCameraUnavailable);
  const isRecoveringMedia = useCallStore((s) => s.isRecoveringMedia);
  const mediaError = useCallStore((s) => s.mediaError);
  const peerMediaState = useCallStore((s) => s.peerMediaState);
  const toggleMute = useCallStore((s) => s.toggleMute);
  const startTime = useCallStore((s) => s.startTime);

  const [duration, setDuration] = useState(0);
  const waitTimeLeft = useRingCountdown(30);
  const {
    recoverLocalMedia,
    setCameraEnabled,
    endCall: endLocalCall,
  } = useWebRTC();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const endedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const terminatingRef = useRef(false);

  const { endCall: endCallAPI, rejectCall } = useCallService();

  const handleTerminateCall = useCallback(
    async ({ reason = "ended" }: { reason: CallStatus }) => {
      const { setStatus, reset, callType, ringStartedAt } = useCallStore.getState();

      if (!callType || terminatingRef.current) return;
      terminatingRef.current = true;

      setStatus(reason);
      endLocalCall();

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
        const currentCall = useCallStore.getState();
        if (
          currentCall.status === reason &&
          currentCall.ringStartedAt === ringStartedAt
        ) {
          reset();
        }
        terminatingRef.current = false;
        endedTimerRef.current = null;
      }, 2000);
    },
    [endCallAPI, endLocalCall, rejectCall],
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (endedTimerRef.current) clearTimeout(endedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (waitTimeLeft === 0) {
      const { role, status, startTime, ringStartedAt } = useCallStore.getState();
      const hasTimedOut = Boolean(
        ringStartedAt && Date.now() - ringStartedAt >= 30_000,
      );

      if (role === "caller" && status === "calling" && !startTime && hasTimedOut) {
        handleTerminateCall({ reason: "missed" });
      }
    }
  }, [handleTerminateCall, waitTimeLeft]);

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

  const handleEndCall = () => {
    const { role, status, startTime } = useCallStore.getState();
    const isWaitingForAnswer = role === "caller" && status === "calling" && !startTime;
    handleTerminateCall({ reason: isWaitingForAnswer ? "missed" : "ended" });
  };

  const handleToggleCamera = async () => {
    try {
      await setCameraEnabled(isCamOff || isCameraUnavailable);
    } catch (error) {
      console.error("Failed to toggle camera:", error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (startTime && (status === "calling" || status === "connected")) {
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

  const hasLocalVideo = Boolean(
    localStream?.getVideoTracks().some((track) => track.readyState === "live"),
  );
  const isPeerCameraOff =
    peerMediaState?.isCamOff ||
    peerMediaState?.isCameraUnavailable ||
    peerMediaState?.hasVideo === false;

  // ── Active call UI ───────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex h-dvh w-dvw max-w-full flex-col overflow-hidden bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-white/6 bg-[#0a0a0f]/90 px-3 py-2 backdrop-blur-md sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] bg-[#111118] border border-white/6">
            <Video className="w-4.5 h-4.5 text-indigo-400" />
          </div>
          <div className="min-w-0 leading-none">
            <p className="flex min-w-0 items-center gap-2 text-[12px] font-semibold text-white sm:text-[13px]">
              <span className="min-w-0 truncate">Call with {peerUser?.name}</span>
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

        <div className="flex shrink-0 items-center gap-2">
          {[
            { label: "Share screen", icon: <ScreenShare className="w-4 h-4" /> },
            { label: "Settings", icon: <Settings className="w-4 h-4" /> },
          ].map(({ label, icon }) => (
            <button
              key={label}
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-[14px] border border-white/6 bg-[#111118] text-white/50 transition-colors hover:bg-white/8 hover:text-white"
            >
              {icon}
            </button>
          ))}
        </div>
      </header>

      {/* Video stage */}
      <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#050508] p-2 pb-28 sm:p-4 sm:pb-32">
        {/* Remote video card */}
        <div className="relative h-full max-h-full w-full max-w-6xl overflow-hidden rounded-2xl border border-white/6 bg-[#111118] shadow-2xl shadow-black/60 sm:rounded-[28px]">
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
              <p className="px-4 text-center text-[13px] text-white/35">
                Waiting for remote video…
              </p>
              <p className="text-[11px] text-white/25">
                Auto-cancel in {waitTimeLeft}s
              </p>
            </div>
          )}

          {/* PiP — local video */}
          {remoteStream && isPeerCameraOff && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface">
              <VideoOff className="w-8 h-8 text-ink-4" />
              <p className="px-4 text-center text-[13px] font-medium text-white/60">
                {peerUser?.name || "Peer"} camera is off
              </p>
            </div>
          )}

          <div className="absolute right-2 top-2 z-20 aspect-video w-[clamp(7rem,32vw,11rem)] overflow-hidden rounded-2xl border border-white/10 bg-[#111118] shadow-xl shadow-black/50 sm:right-4 sm:top-4 sm:rounded-[20px]">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Overlay when no stream yet */}
            {(!hasLocalVideo || isCameraUnavailable) && (
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
        {(mediaError || isRecoveringMedia) && (
          <div className="absolute left-1/2 top-4 z-30 flex w-full sm:w-fit max-w-[calc(100dvw-2rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-warning/25 bg-surface/95 px-4 py-3 text-xs text-white shadow-lg backdrop-blur-md">
            {isRecoveringMedia ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-warning" />
            ) : (
              <VideoOff className="h-4 w-4 shrink-0 text-warning" />
            )}
            <span className="min-w-0 text-white/70">
              {isRecoveringMedia ? "Restoring camera and microphone..." : mediaError}
            </span>
            {!isRecoveringMedia && (
              <button
                type="button"
                onClick={() => void recoverLocalMedia().catch(() => undefined)}
                className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-brand-hover"
              >
                Retry
              </button>
            )}
          </div>
        )}

        <div className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 flex max-w-[calc(100dvw-1rem)] -translate-x-1/2 items-start gap-2 overflow-x-auto rounded-2xl border border-white/6 bg-[#111118]/90 px-3 py-3 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:bottom-8 sm:gap-3 sm:rounded-[28px] sm:px-6 sm:py-4">
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
            active={isCamOff || isCameraUnavailable}
            onClick={handleToggleCamera}
            disabled={isRecoveringMedia}
            label={isCamOff || isCameraUnavailable ? "Start Camera" : "Stop Camera"}
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
