/* ═══════════════════════════════════════════════════════════
   hooks/useWebRTC.ts
   TODO: tên event WebRTC phải khớp backend:
     - "webrtc:offer" / "webrtc:answer" / "webrtc:ice_candidate"
     - "call:end"
   ═══════════════════════════════════════════════════════════ */
"use client";
import { useRef, useEffect, useCallback } from "react";
import { getSocket } from "./useSocket";
import { useCallStore } from "@/store";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useWebRTC(
  localRef:  React.RefObject<HTMLVideoElement | null>,
  remoteRef: React.RefObject<HTMLVideoElement | null>,
) {
  const pc          = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);

  const { peerSocketId, isMuted, isCamOff, setStatus } = useCallStore();

  /* ── Helpers ── */
  const createPC = useCallback(() => {
    const conn = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    conn.onicecandidate = (e) => {
      if (e.candidate && peerSocketId)
        // TODO: event name "webrtc:ice_candidate"
        getSocket()?.emit("webrtc:ice_candidate", { targetSocketId: peerSocketId, candidate: e.candidate });
    };
    conn.ontrack = (e) => {
      if (remoteRef.current && e.streams[0])
        remoteRef.current.srcObject = e.streams[0];
    };
    conn.onconnectionstatechange = () => {
      if (["disconnected", "failed"].includes(conn.connectionState))
        setStatus("ended");
    };
    return conn;
  }, [peerSocketId, remoteRef, setStatus]);

  const getMedia = useCallback(async (type: "audio" | "video") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video" ? { width: 1280, height: 720 } : false,
    });
    localStream.current = stream;
    if (localRef.current) localRef.current.srcObject = stream;
    return stream;
  }, [localRef]);

  /* ── Start call (caller side) ── */
  const startCall = useCallback(async (targetSocketId: string, type: "audio" | "video") => {
    try {
      const stream = await getMedia(type);
      const conn   = createPC();
      pc.current   = conn;
      stream.getTracks().forEach((t) => conn.addTrack(t, stream));
      const offer  = await conn.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await conn.setLocalDescription(offer);
      // TODO: event name "webrtc:offer"
      getSocket()?.emit("webrtc:offer", { targetSocketId, offer });
    } catch {
      setStatus("ended");
    }
  }, [getMedia, createPC, setStatus]);

  /* ── Receive offer → answer ── */
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    // TODO: event name "webrtc:offer"
    const handler = async (data: any) => {
      const stream = await getMedia(data.callType || "video");
      const conn   = createPC();
      pc.current   = conn;
      stream.getTracks().forEach((t) => conn.addTrack(t, stream));
      await conn.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await conn.createAnswer();
      await conn.setLocalDescription(answer);
      // TODO: event name "webrtc:answer"
      s.emit("webrtc:answer", { targetSocketId: data.fromSocketId, answer });
    };
    s.on("webrtc:offer", handler);
    return () => { s.off("webrtc:offer", handler); };
  }, [getMedia, createPC]);

  /* ── Receive answer ── */
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const handler = async (data: any) => {
      await pc.current?.setRemoteDescription(new RTCSessionDescription(data.answer));
    };
    s.on("webrtc:answer", handler);
    return () => { s.off("webrtc:answer", handler); };
  }, []);

  /* ── ICE candidates ── */
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const handler = ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      pc.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
    };
    s.on("webrtc:ice_candidate", handler);
    return () => { s.off("webrtc:ice_candidate", handler); };
  }, []);

  /* ── Controls ── */
  const toggleMute = useCallback(() => {
    localStream.current?.getAudioTracks().forEach((t) => { t.enabled = isMuted; });
    useCallStore.getState().toggleMute();
  }, [isMuted]);

  const toggleCam = useCallback(() => {
    localStream.current?.getVideoTracks().forEach((t) => { t.enabled = isCamOff; });
    useCallStore.getState().toggleCam();
  }, [isCamOff]);

  const endCall = useCallback((targetSocketId?: string, convId?: string, duration?: number) => {
    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    pc.current?.close();
    pc.current = null;
    if (localRef.current)  localRef.current.srcObject  = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;
    if (targetSocketId)
      // TODO: event name "call:end"
      getSocket()?.emit("call:end", { targetSocketId, conversationId: convId, duration });
    useCallStore.getState().reset();
  }, [localRef, remoteRef]);

  return { startCall, endCall, toggleMute, toggleCam };
}
