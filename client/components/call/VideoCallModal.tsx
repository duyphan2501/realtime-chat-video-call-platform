/* ═══════════════════════════════════════════════════════════
   components/call/VideoCallModal.tsx

   TODO — backend / WebRTC:
   ① emit "call:invite" khi bắt đầu gọi — server relay sang bên kia
   ② useWebRTC.startCall() khi trạng thái "connected"
   ③ useWebRTC.endCall()   khi kết thúc / huỷ
   ④ Lưu call log vào conversation (backend xử lý khi "call:end")
   ═══════════════════════════════════════════════════════════ */
"use client";
import { useEffect, useRef, useState } from "react";
import type { User } from "@/types";
import { useAuthStore, useCallStore } from "@/store";
import { getSocket } from "@/hooks";
import { useWebRTC } from "@/hooks";

export default function VideoCallModal() {
  const {
    status,
    callType,
    incoming,
    peerSocketId,
    convId,
    isMuted,
    isCamOff,
    reset,
  } = useCallStore();
  const currentUser = useAuthStore((s) => s.user);
  if (!currentUser) return null;
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const { startCall, endCall } = useWebRTC(localRef, remoteRef);
  const { toggleMute, toggleCam } = useCallStore();
  const [elapsed, setElapsed] = useState(0);

  // /* ── Duration timer ── */
  // useEffect(() => {
  //   if (status !== "connected") {
  //     setElapsed(0);
  //     return;
  //   }
  //   const id = setInterval(() => setElapsed((n) => n + 1), 1000);
  //   return () => clearInterval(id);
  // }, [status]);

  // /* ── Start WebRTC when connected ──────────────
  //    TODO ②: startCall() cần peerSocketId của bên kia */
  // useEffect(() => {
  //   if (status === "connected" && peerSocketId && callType)
  //     startCall(peerSocketId, callType);
  // }, [status, peerSocketId, callType, startCall]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  /* ── Accept incoming ── TODO ①: emit "call:accept" */
  const accept = () => {
    if (!incoming) return;
    getSocket()?.emit("call:accept", {
      callerSocketId: incoming.callerSocketId,
      calleeSocketId: getSocket()?.id,
    });
    useCallStore.getState().setStatus("connected");
    useCallStore.getState().setPeer(incoming.callerSocketId);
    useCallStore.getState().setConvId(incoming.conversationId);
    useCallStore.getState().setCallType(incoming.callType);
    useCallStore.getState().setIncoming(null);
  };

  /* ── Reject / End ── TODO ③: useWebRTC.endCall() */
  const reject = () => {
    if (incoming)
      getSocket()?.emit("call:reject", {
        callerSocketId: incoming.callerSocketId,
      });
    endCall(peerSocketId ?? undefined);
  };

  if (status === "idle") return null;

  /* ═══ 1. Ringing (incoming) ═══ */
  if (status === "ringing" && incoming) {
    return (
      <div
        className="fixed bottom-5 right-5 z-50 flex items-center gap-4 px-5 py-4 rounded-3xl animate-scale-in"
        style={{
          background: "var(--color-surface)",
          boxShadow: "var(--shadow-lg)",
          minWidth: 280,
        }}
      >
        {/* Pulse avatar */}
        <div className="relative shrink-0">
          <div
            className="absolute inset-0 rounded-full animate-ripple"
            style={{ background: "var(--color-brand)", opacity: 0.3 }}
          />
          <img
            src={incoming.from.avatar}
            className="relative z-10 w-12 h-12 rounded-full object-cover"
            alt={incoming.from.name}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{incoming.from.name}</p>
          <p className="text-xs" style={{ color: "var(--color-ink-3)" }}>
            {incoming.callType === "video"
              ? "📹 Cuộc gọi video"
              : "📞 Cuộc gọi thoại"}{" "}
            đến
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <RoundBtn
            color="var(--color-danger)"
            title="Từ chối"
            onClick={reject}
          >
            <PhoneOffIcon className="w-5 h-5" />
          </RoundBtn>
          <RoundBtn
            color="var(--color-online)"
            title="Chấp nhận"
            onClick={accept}
          >
            <PhoneIcon className="w-5 h-5" />
          </RoundBtn>
        </div>
      </div>
    );
  }

  /* ═══ 2. Calling (outgoing) ═══ */
  if (status === "calling") {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center animate-fade-in"
        style={{ background: "rgba(13,14,20,.95)" }}
      >
        <div className="relative mb-8">
          <div
            className="absolute inset-0 rounded-full animate-ripple"
            style={{ background: "var(--color-brand)", opacity: 0.2 }}
          />
          <div
            className="absolute inset-0 rounded-full animate-ripple"
            style={{
              background: "var(--color-brand)",
              opacity: 0.15,
              animationDelay: ".5s",
            }}
          />
          <img
            src={incoming?.from.avatar || ""}
            className="relative z-10 w-28 h-28 rounded-full object-cover"
            alt=""
          />
        </div>
        <p className="text-white font-bold text-xl mb-2">Đang gọi…</p>
        <p className="text-white/50 text-sm mb-12">Vui lòng đợi</p>
        <RoundBtn color="var(--color-danger)" title="Huỷ" onClick={reject}>
          <PhoneOffIcon className="w-6 h-6" />
        </RoundBtn>
      </div>
    );
  }

  /* ═══ 3. Connected ═══ */
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col animate-fade-in"
      style={{ background: "#0D0E14" }}
    >
      {/* Remote video */}
      <video
        ref={remoteRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Local PiP */}
      <video
        ref={localRef}
        autoPlay
        playsInline
        muted
        className="absolute top-5 right-5 w-36 h-48 rounded-2xl object-cover z-10"
        style={{ boxShadow: "var(--shadow-md)" }}
      />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white/10"></div>
          <div>
            <p className="text-white font-semibold text-sm">
              {currentUser.name}
            </p>
            <p className="text-white/50 text-xs">{fmt(elapsed)}</p>
          </div>
        </div>
        <span
          className="text-white/50 text-xs px-2 py-1 rounded-full"
          style={{ background: "rgba(255,255,255,.1)" }}
        >
          {callType === "video" ? "📹 Video" : "📞 Thoại"}
        </span>
      </div>

      <div className="flex-1" />

      {/* Controls */}
      <div className="relative z-20 flex items-center justify-center gap-5 pb-10">
        <ControlBtn
          onClick={toggleMute}
          active={isMuted}
          label={isMuted ? "Bỏ tắt tiếng" : "Tắt tiếng"}
        >
          {isMuted ? (
            <MicOffIcon className="w-5 h-5" />
          ) : (
            <MicIcon className="w-5 h-5" />
          )}
        </ControlBtn>

        {callType === "video" && (
          <ControlBtn
            onClick={toggleCam}
            active={isCamOff}
            label={isCamOff ? "Bật camera" : "Tắt camera"}
          >
            {isCamOff ? (
              <CamOffIcon className="w-5 h-5" />
            ) : (
              <CamIcon className="w-5 h-5" />
            )}
          </ControlBtn>
        )}

        {/* End call — TODO ③ */}
        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => endCall(peerSocketId ?? undefined)}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95"
            style={{ background: "var(--color-danger)" }}
          >
            <PhoneOffIcon className="w-6 h-6 text-white" />
          </button>
          <span className="text-white/50 text-[11px]">Kết thúc</span>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────── */
function RoundBtn({
  children,
  color,
  title,
  onClick,
}: {
  children: React.ReactNode;
  color: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-all active:scale-95"
      style={{ background: color }}
    >
      {children}
    </button>
  );
}

function ControlBtn({
  children,
  onClick,
  active,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95"
        style={{
          background: active ? "rgba(239,68,68,.5)" : "rgba(255,255,255,.15)",
          color: "white",
        }}
      >
        {children}
      </button>
      <span className="text-white/50 text-[11px]">{label}</span>
    </div>
  );
}

/* ── Icons ───────────────────────────────────────── */
const PhoneIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);
const PhoneOffIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      d="M16.5 12.5l-1.2 1.2a11 11 0 01-4.95-4.95l1.2-1.2m2.09-3.93A10 10 0 1 1 4.5 19.5"
    />
    <path strokeLinecap="round" d="M3 3l18 18" />
  </svg>
);
const MicIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4m-4 0h8"
    />
  </svg>
);
const MicOffIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      d="M1 1l22 22M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23M12 19v4m-4 0h8"
    />
  </svg>
);
const CamIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      d="M23 7l-7 5 7 5V7zM1 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5z"
    />
  </svg>
);
const CamOffIcon = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34l1 1L23 7v10M1 1l22 22"
    />
  </svg>
);
