"use client";

import { useRef, useEffect, useCallback } from "react";
import { useSocketStore, useCallStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { User } from "@/types";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
];

export function useWebRTC() {
  const pc = useRef<RTCPeerConnection | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

  // Lấy socket trực tiếp từ store để sync listener chính xác
  const socket = useSocketStore((s) => s.socket);

  const {
    setStatus,
    setPeerUser,
    setLocalStream,
    setRemoteStream,
    setCallType,
    setStartTime,
    callType,
    setRole,
    setRingStartedAt,
  } = useCallStore(
    useShallow((s) => ({
      setStatus: s.setStatus,
      setPeerUser: s.setPeerUser,
      setLocalStream: s.setLocalStream,
      setRemoteStream: s.setRemoteStream,
      reset: s.reset,
      setCallType: s.setCallType,
      callType: s.callType,
      setStartTime: s.setStartTime,
      setRole: s.setRole,
      setRingStartedAt: s.setRingStartedAt
    })),
  );

  // Giữ canvas trong ref để tránh GC
  const dummyCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const createEmptyVideoTrack = useCallback(() => {
    if (!dummyCanvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      dummyCanvasRef.current = canvas;
    }

    const canvas = dummyCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#161625";
      ctx.fillRect(0, 0, 640, 480);
    }

    return canvas.captureStream(0).getVideoTracks()[0]; // 0 fps = static frame, tiết kiệm CPU
  }, []);

  const getSafeMedia = useCallback(async (type: "audio" | "video") => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video" ? { width: 1280, height: 720 } : false,
      });
    } catch (err: any) {
      console.warn("Media Error, falling back to dummy video:", err.name);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        audioStream.addTrack(createEmptyVideoTrack());
        return audioStream;
      } catch {
        return new MediaStream([createEmptyVideoTrack()]);
      }
    }
  }, []);

  const flushIceQueue = useCallback(async () => {
    // Chỉ flush khi Remote Description đã được thiết lập thành công
    if (!pc.current?.remoteDescription) return;

    while (iceCandidateQueue.current.length > 0) {
      const candidate = iceCandidateQueue.current.shift()!;
      try {
        if (pc.current.signalingState !== "closed") {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.warn("Flush ICE candidate failed:", err);
      }
    }
  }, []);

  const createPC = useCallback(() => {
    // Dọn dẹp instance cũ trước khi tạo mới để tránh rò rỉ bộ nhớ & event
    if (pc.current) {
      pc.current.onicecandidate = null;
      pc.current.ontrack = null;
      pc.current.close();
    }

    iceCandidateQueue.current = [];
    const conn = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    conn.onicecandidate = (e) => {
      if (e.candidate && socket) {
        const { peerUser } = useCallStore.getState();
        socket.emit("webrtc:ice_candidate", {
          targetUserId: peerUser?._id,
          candidate: e.candidate,
        });
      }
    };

    conn.onconnectionstatechange = () => {
      if (conn.connectionState === "connected") {
        // Cuộc gọi thực sự bắt đầu nghe được tiếng/hình
        setStartTime(Date.now());
      }
    };

    conn.ontrack = (e) => {
      if (e.streams[0]) setRemoteStream(e.streams[0]);
    };

    pc.current = conn;
    return conn;
  }, [socket, setRemoteStream]);

  // --- Actions ---
  const startCall = useCallback(
    async (targetUserId: string, type: "audio" | "video") => {
      try {
        setStatus("connecting");
        setRole("caller")
        setCallType(type);
        const conn = createPC();
        const stream = await getSafeMedia(type);
        setLocalStream(stream);

        // Add audio tracks
        stream.getAudioTracks().forEach((t) => conn.addTrack(t, stream));

        // Add video track — dùng dummy nếu không có track thực
        if (type === "video") {
          const videoTrack =
            stream.getVideoTracks()[0] ?? createEmptyVideoTrack();
          conn.addTrack(videoTrack, stream);
        }

        const offer = await conn.createOffer();
        await conn.setLocalDescription(offer);
        const now = Date.now()

        socket?.emit("webrtc:offer", {
          targetUserId,
          offer,
          callType: type,
          startedAt: now,
        });
        setRingStartedAt(now)
        setStatus("calling");
      } catch (err) {
        console.error("Start call failed:", err);
        setStatus("idle");
        setLocalStream(null);
      }
    },
    [getSafeMedia, createPC, socket],
  );

  const acceptCall = useCallback(async () => {
    const { incoming } = useCallStore.getState();
    if (!incoming) return;

    try {
      const stream = await getSafeMedia(callType ?? "audio");
      setLocalStream(stream);
      const conn = createPC();

      // Tương tự startCall — đảm bảo video track luôn có trong SDP
      stream.getAudioTracks().forEach((t) => conn.addTrack(t, stream));
      if (callType === "video") {
        const videoTrack =
          stream.getVideoTracks()[0] ?? createEmptyVideoTrack();
        conn.addTrack(videoTrack, stream);
      }
      setRole("callee")
      setPeerUser(incoming.from);

      await conn.setRemoteDescription(
        new RTCSessionDescription(incoming.offer),
      );
      await flushIceQueue();

      const answer = await conn.createAnswer();
      await conn.setLocalDescription(answer);

      socket?.emit("webrtc:answer", {
        targetUserId: incoming.from._id,
        answer,
      });
      setStatus("calling");
    } catch (err) {
      console.error("Accept call failed:", err);
    }
  }, [getSafeMedia, createPC, flushIceQueue, socket, callType]);

  // endCall — thêm flag isEnding để tránh chạy 2 lần
  const isEndingRef = useRef(false);

  const endCall = useCallback(() => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    const { localStream } = useCallStore.getState();

    localStream?.getTracks().forEach((t) => t.stop());

    if (pc.current) {
      pc.current.onicecandidate = null;
      pc.current.ontrack = null;
      pc.current.close();
      pc.current = null;
    }

    iceCandidateQueue.current = [];
    dummyCanvasRef.current = null;

    // Reset flag sau một tick để tránh block lần end tiếp theo
    setTimeout(() => {
      isEndingRef.current = false;
    }, 100);
  }, [socket]);

  // --- Socket Listeners ---
  useEffect(() => {
    if (!socket) return;

    const onAnswer = async ({
      answer,
      peerUser,
    }: {
      answer: RTCSessionDescriptionInit;
      peerUser: User;
    }) => {
      const connection = pc.current;
      setPeerUser(peerUser);
      // FIX: Chặn lỗi 'stable' bằng cách kiểm tra signalingState
      // Chỉ thực hiện setRemoteDescription nếu đang ở trạng thái 'have-local-offer'
      if (!connection || connection.signalingState !== "have-local-offer") {
        console.warn(
          `Bỏ qua answer. Trạng thái hiện tại: ${connection?.signalingState}`,
        );
        return;
      }

      try {
        await connection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );
        await flushIceQueue();
      } catch (err) {
        console.error("Lỗi khi setRemoteDescription (answer):", err);
      }
    };

    const onIceCandidate = async ({
      candidate,
    }: {
      candidate: RTCIceCandidateInit;
    }) => {
      const connection = pc.current;
      if (
        connection?.remoteDescription &&
        connection.signalingState !== "closed"
      ) {
        try {
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("addIceCandidate trực tiếp thất bại:", err);
        }
      } else {
        // Lưu vào hàng đợi nếu Remote Description chưa sẵn sàng
        iceCandidateQueue.current.push(candidate);
      }
    };

    socket.on("webrtc:answer", onAnswer);
    socket.on("webrtc:ice_candidate", onIceCandidate);

    return () => {
      socket.off("webrtc:answer", onAnswer);
      socket.off("webrtc:ice_candidate", onIceCandidate);
    };
  }, [socket, flushIceQueue]);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return { startCall, endCall, acceptCall };
}
