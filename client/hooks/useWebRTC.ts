"use client";
import { useRef, useEffect, useCallback } from "react";
import { useSocketStore, useCallStore } from "@/store";
import { useShallow } from 'zustand/react/shallow';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

export function useWebRTC(
  localRef:  React.RefObject<HTMLVideoElement | null>,
  remoteRef: React.RefObject<HTMLVideoElement | null>,
) {
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  
  const socket = useSocketStore((s) => s.socket);
  const { peerSocketId, isMuted, isCamOff, setStatus, reset } = useCallStore(
    useShallow((s) => ({
      peerSocketId: s.peerSocketId,
      isMuted:      s.isMuted,
      isCamOff:     s.isCamOff,
      setStatus:    s.setStatus,
      reset:        s.reset,
    }))
  );

  // 1. Dọn dẹp tài nguyên (Rất quan trọng để tắt đèn Camera)
  const cleanup = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach((t) => t.stop());
      localStream.current = null;
    }
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
    if (localRef.current)  localRef.current.srcObject  = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;
  }, [localRef, remoteRef]);

  // 2. Khởi tạo Peer Connection
  const createPC = useCallback(() => {
    if (pc.current) pc.current.close();
    const conn = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    conn.onicecandidate = (e) => {
      if (e.candidate && peerSocketId && socket) {
        socket.emit("webrtc:ice_candidate", { targetSocketId: peerSocketId, candidate: e.candidate });
      }
    };

    conn.ontrack = (e) => {
      if (remoteRef.current && e.streams[0]) {
        remoteRef.current.srcObject = e.streams[0];
      }
    };

    conn.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(conn.connectionState)) {
        cleanup();
        setStatus("ended");
      }
    };
    return conn;
  }, [peerSocketId, socket, remoteRef, setStatus, cleanup]);

  // 3. Lấy quyền truy cập Camera/Micro
  const getMedia = useCallback(async (type: "audio" | "video") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video" ? { width: 1280, height: 720 } : false,
      });
      localStream.current = stream;
      if (localRef.current) localRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      console.error("Media Error:", err);
      throw err;
    }
  }, [localRef]);

  // 4. Bắt đầu cuộc gọi (Caller)
  const startCall = useCallback(async (targetSocketId: string, type: "audio" | "video") => {
    try {
      const stream = await getMedia(type);
      const conn   = createPC();
      pc.current   = conn;
      stream.getTracks().forEach((t) => conn.addTrack(t, stream));
      
      const offer = await conn.createOffer();
      await conn.setLocalDescription(offer);
      socket?.emit("webrtc:offer", { targetSocketId, offer, callType: type });
    } catch (error) {
      setStatus("idle");
    }
  }, [getMedia, createPC, socket, setStatus]);

  // 5. Lắng nghe các sự kiện WebRTC thực thi (Passive Signaling)
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ fromSocketId, offer, callType }: any) => {
      const stream = await getMedia(callType || "video");
      const conn   = createPC();
      pc.current   = conn;
      stream.getTracks().forEach((t) => conn.addTrack(t, stream));
      await conn.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await conn.createAnswer();
      await conn.setLocalDescription(answer);
      socket.emit("webrtc:answer", { targetSocketId: fromSocketId, answer });
    };

    const handleAnswer = async ({ answer }: any) => {
      if (pc.current) await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleCandidate = async ({ candidate }: any) => {
      if (pc.current) await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice_candidate", handleCandidate);

    return () => {
      socket.off("webrtc:offer");
      socket.off("webrtc:answer");
      socket.off("webrtc:ice_candidate");
    };
  }, [socket, getMedia, createPC]);

  // 6. Sync trạng thái Mute/Cam từ Store vào MediaStream thực tế
  useEffect(() => {
    localStream.current?.getAudioTracks().forEach(t => t.enabled = !isMuted);
  }, [isMuted]);

  useEffect(() => {
    localStream.current?.getVideoTracks().forEach(t => t.enabled = !isCamOff);
  }, [isCamOff]);

  const endCall = useCallback((targetSocketId?: string) => {
    if (targetSocketId && socket) socket.emit("call:end", { targetSocketId });
    cleanup();
    reset();
  }, [socket, cleanup, reset]);

  return { startCall, endCall };
}
