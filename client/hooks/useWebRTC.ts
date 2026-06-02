"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { useSocketStore, useCallStore, useConversationStore } from "@/store";
import { useShallow } from "zustand/react/shallow";
import { CallMediaState, CallType, User } from "@/types";

const getIceServers = (): RTCIceServer[] => {
  const servers: RTCIceServer[] = [
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ],
    },
  ];

  const turnUrls = process.env.NEXT_PUBLIC_TURN_URLS;
  const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
  const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

  const parsedTurnUrls = turnUrls?.split(",").map((url) => url.trim()).filter(Boolean);
  if (parsedTurnUrls?.length) {
    servers.push({
      urls: parsedTurnUrls,
      username: turnUsername,
      credential: turnCredential,
    });
  }

  return servers;
};

const ICE_SERVERS = getIceServers();

type QueuedIceCandidate = {
  candidate: RTCIceCandidateInit;
  fromUserId?: string;
};

const getCandidateKey = (candidate: RTCIceCandidateInit) =>
  candidate.candidate ||
  `${candidate.sdpMid ?? ""}:${candidate.sdpMLineIndex ?? ""}:${candidate.usernameFragment ?? ""}`;

class MediaAccessError extends Error {
  name: string;

  constructor(error: unknown, fallbackMessage: string) {
    const original = error as DOMException | Error | undefined;
    super(original?.message || fallbackMessage);
    this.name = original?.name || "MediaAccessError";
  }
}

type LocalMediaResult = {
  stream: MediaStream;
  hasAudio: boolean;
  hasVideo: boolean;
  audioError: unknown;
  videoError: unknown;
};

type WebRTCActions = {
  startCall: (targetUserId: string, type: CallType) => Promise<void>;
  endCall: () => void;
  acceptCall: () => Promise<void>;
  recoverLocalMedia: () => Promise<void>;
  setCameraEnabled: (enabled: boolean) => Promise<void>;
};

const getMediaErrorMessage = (error: unknown, kind: "audio" | "video") => {
  const err = error as DOMException | Error | undefined;
  if (!err) return null;

  if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
    return kind === "audio"
      ? "Microphone access was denied. Please allow microphone access and try again."
      : "Camera access was denied. The call can continue with audio.";
  }

  if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
    return kind === "audio"
      ? "No microphone was found. Please connect one and try again."
      : "No camera was found. The call can continue with audio.";
  }

  return kind === "audio"
    ? "Could not access microphone. Please check your device settings."
    : "Could not access camera. The call can continue with audio.";
};

const WebRTCContext = createContext<WebRTCActions | null>(null);

function useWebRTCController(): WebRTCActions {
  const instanceIdRef = useRef(Symbol("useWebRTC"));
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pcOwnerRef = useRef<symbol | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const iceCandidateQueueRef = useRef<QueuedIceCandidate[]>([]);
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const permissionStatusRefs = useRef<PermissionStatus[]>([]);
  const isEndingRef = useRef(false);

  const socket = useSocketStore((s) => s.socket);
  const mediaSignal = useCallStore(
    (s) =>
      `${s.status}:${s.isMuted}:${s.isCamOff}:${s.isCameraUnavailable}:${s.localStream?.id ?? ""}`,
  );

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
    setConversationId,
    setMediaError,
    setRecoveringMedia,
    setMediaPermissions,
    setCamOff,
  } = useCallStore(
    useShallow((s) => ({
      setStatus: s.setStatus,
      setPeerUser: s.setPeerUser,
      setLocalStream: s.setLocalStream,
      setRemoteStream: s.setRemoteStream,
      setConversationId: s.setConversationId,
      setCallType: s.setCallType,
      callType: s.callType,
      setStartTime: s.setStartTime,
      setRole: s.setRole,
      setRingStartedAt: s.setRingStartedAt,
      setMediaError: s.setMediaError,
      setRecoveringMedia: s.setRecoveringMedia,
      setMediaPermissions: s.setMediaPermissions,
      setCamOff: s.setCamOff,
    })),
  );

  const queueIceCandidate = useCallback(
    (candidate: RTCIceCandidateInit, fromUserId?: string) => {
      const key = `${fromUserId ?? ""}:${getCandidateKey(candidate)}`;
      const isQueued = iceCandidateQueueRef.current.some(
        (queued) =>
          `${queued.fromUserId ?? ""}:${getCandidateKey(queued.candidate)}` === key,
      );

      if (!isQueued) {
        iceCandidateQueueRef.current.push({ candidate, fromUserId });
      }
    },
    [],
  );

  const emitMediaState = useCallback(() => {
    const { peerUser, localStream, isMuted, isCamOff, isCameraUnavailable } =
      useCallStore.getState();
    if (!socket || !peerUser?._id) return;

    const mediaState: CallMediaState = {
      hasAudio: Boolean(localStream?.getAudioTracks().some((t) => t.readyState === "live")),
      hasVideo: Boolean(localStream?.getVideoTracks().some((t) => t.readyState === "live")),
      isCameraUnavailable,
      isMuted,
      isCamOff,
    };

    socket.emit("call:media_state", {
      targetUserId: peerUser._id,
      mediaState,
    });
  }, [socket]);

  const replaceSenderTrack = useCallback(
    async (kind: "audio" | "video", track: MediaStreamTrack | null) => {
      const connection = pcRef.current;
      if (!connection || connection.signalingState === "closed") return;

      const kindSender =
        connection.getSenders().find((sender) => sender.track?.kind === kind) ??
        connection
          .getTransceivers()
          .find((transceiver) => transceiver.receiver.track.kind === kind)
          ?.sender;

      if (kindSender) {
        await kindSender.replaceTrack(track);
        return;
      }

      if (track) {
        const { localStream } = useCallStore.getState();
        connection.addTrack(track, localStream ?? new MediaStream([track]));
      }
    },
    [],
  );

  const attachTrackLifecycle = useCallback(
    (track: MediaStreamTrack) => {
      track.onended = () => {
        if (track.kind === "video") {
          setMediaPermissions({
            hasVideoPermission: false,
            isCameraUnavailable: true,
          });
          setCamOff(true);
          setMediaError("Camera access changed. Trying to restore video...");
          void replaceSenderTrack("video", null).then(emitMediaState);
        } else {
          setMediaPermissions({ hasAudioPermission: false });
          setMediaError("Microphone access changed. Please allow microphone access to continue.");
          void replaceSenderTrack("audio", null).then(emitMediaState);
        }
      };
    },
    [emitMediaState, replaceSenderTrack, setCamOff, setMediaError, setMediaPermissions],
  );

  const acquireLocalMedia = useCallback(
    async (type: CallType): Promise<LocalMediaResult> => {
      const tracks: MediaStreamTrack[] = [];
      let audioError: unknown = null;
      let videoError: unknown = null;

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        tracks.push(...audioStream.getAudioTracks());
      } catch (error) {
        audioError = error;
      }

      if (type === "video") {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { width: 1280, height: 720 },
          });
          tracks.push(...videoStream.getVideoTracks());
        } catch (error) {
          videoError = error;
        }
      }

      const stream = new MediaStream(tracks);
      const hasAudio = stream.getAudioTracks().length > 0;
      const hasVideo = stream.getVideoTracks().length > 0;

      if (!hasAudio) {
        stream.getTracks().forEach((track) => track.stop());
        throw new MediaAccessError(
          audioError,
          "Microphone access is required to start a call.",
        );
      }

      stream.getTracks().forEach(attachTrackLifecycle);

      setMediaPermissions({
        hasAudioPermission: hasAudio,
        hasVideoPermission: type === "video" ? hasVideo : true,
        isCameraUnavailable: type === "video" && !hasVideo,
      });
      setCamOff(type === "video" && !hasVideo);
      setMediaError(type === "video" ? getMediaErrorMessage(videoError, "video") : null);

      return {
        stream,
        hasAudio,
        hasVideo,
        audioError,
        videoError,
      };
    },
    [attachTrackLifecycle, setCamOff, setMediaError, setMediaPermissions],
  );

  const mergeLocalStream = useCallback((newTracks: MediaStreamTrack[]) => {
    const { localStream } = useCallStore.getState();
    const nextStream = localStream ?? new MediaStream();

    newTracks.forEach((track) => {
      nextStream.getTracks().forEach((existingTrack) => {
        if (existingTrack.kind === track.kind && existingTrack.id !== track.id) {
          existingTrack.stop();
          nextStream.removeTrack(existingTrack);
        }
      });
      nextStream.addTrack(track);
    });

    setLocalStream(nextStream);
    return nextStream;
  }, [setLocalStream]);

  const flushIceQueue = useCallback(async () => {
    if (!pcRef.current?.remoteDescription) return;

    while (iceCandidateQueueRef.current.length > 0) {
      const queued = iceCandidateQueueRef.current.shift();
      if (!queued) continue;

      const { peerUser, incoming } = useCallStore.getState();
      const expectedPeerId = peerUser?._id ?? incoming?.from?._id;
      if (queued.fromUserId && expectedPeerId && queued.fromUserId !== expectedPeerId) {
        continue;
      }

      try {
        if (pcRef.current.signalingState !== "closed") {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(queued.candidate));
        }
      } catch (err) {
        console.warn("Flush ICE candidate failed:", err);
      }
    }
  }, []);

  const closePeerConnection = useCallback((force = false) => {
    if (!force && pcOwnerRef.current !== instanceIdRef.current) return;

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    iceCandidateQueueRef.current = [];
    remoteStreamRef.current = null;
    pcOwnerRef.current = null;
  }, []);

  const createPC = useCallback((preserveIceQueue = false) => {
    const queuedCandidates = preserveIceQueue ? iceCandidateQueueRef.current : [];
    closePeerConnection(true);
    if (preserveIceQueue) {
      iceCandidateQueueRef.current = queuedCandidates;
    }

    pcOwnerRef.current = instanceIdRef.current;
    remoteStreamRef.current = new MediaStream();
    const connection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceTransportPolicy: process.env.NEXT_PUBLIC_FORCE_TURN === "true" ? "relay" : "all",
    });

    connection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        const { peerUser } = useCallStore.getState();
        if (!peerUser?._id) return;

        socket.emit("webrtc:ice_candidate", {
          targetUserId: peerUser._id,
          candidate: event.candidate,
        });
      }
    };

    connection.onconnectionstatechange = () => {
      if (connection.connectionState === "connected") {
        const { startTime } = useCallStore.getState();
        if (!startTime) setStartTime(Date.now());
        setStatus("connected");
      }
    };

    connection.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStream(stream);
        return;
      }

      const remoteStream = remoteStreamRef.current ?? new MediaStream();
      remoteStreamRef.current = remoteStream;

      if (!remoteStream.getTracks().some((track) => track.id === event.track.id)) {
        remoteStream.addTrack(event.track);
      }

      setRemoteStream(remoteStream);
    };

    pcRef.current = connection;
    return connection;
  }, [closePeerConnection, setRemoteStream, setStartTime, setStatus, socket]);

  const prepareSenders = useCallback(
    (connection: RTCPeerConnection, type: CallType, stream: MediaStream) => {
      if (connection.signalingState === "closed") {
        throw new Error("Cannot add local media because the WebRTC connection is closed.");
      }

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) connection.addTrack(audioTrack, stream);

      if (type === "video") {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) connection.addTrack(videoTrack, stream);
        else connection.addTransceiver("video", { direction: "sendrecv" });
      }
    },
    [],
  );

  const recoverLocalMedia = useCallback(async () => {
    const {
      callType: currentCallType,
      status,
      isCamOff,
      isCameraUnavailable,
    } = useCallStore.getState();
    if (!currentCallType || !["calling", "connected"].includes(status)) return;

    const keepCameraOff =
      currentCallType === "video" && isCamOff && !isCameraUnavailable;

    setRecoveringMedia(true);

    try {
      const result = await acquireLocalMedia(currentCallType);
      if (keepCameraOff) {
        result.stream.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
        setCamOff(true);
      }
      mergeLocalStream(result.stream.getTracks());

      await replaceSenderTrack("audio", result.stream.getAudioTracks()[0] ?? null);
      if (currentCallType === "video") {
        await replaceSenderTrack("video", result.stream.getVideoTracks()[0] ?? null);
      }

      if (result.hasVideo || currentCallType === "audio") setMediaError(null);
      emitMediaState();
    } catch (error) {
      setMediaError(getMediaErrorMessage(error, "audio"));
      throw error;
    } finally {
      setRecoveringMedia(false);
    }
  }, [
    acquireLocalMedia,
    emitMediaState,
    mergeLocalStream,
    replaceSenderTrack,
    setCamOff,
    setMediaError,
    setRecoveringMedia,
  ]);

  const setCameraEnabled = useCallback(
    async (enabled: boolean) => {
      const { localStream, callType: currentCallType } = useCallStore.getState();
      if (currentCallType !== "video") return;

      if (!enabled) {
        localStream?.getVideoTracks().forEach((track) => {
          track.enabled = false;
        });
        setCamOff(true);
        emitMediaState();
        return;
      }

      const liveVideoTrack = localStream
        ?.getVideoTracks()
        .find((track) => track.readyState === "live");

      if (liveVideoTrack) {
        liveVideoTrack.enabled = true;
        setCamOff(false);
        setMediaPermissions({
          hasVideoPermission: true,
          isCameraUnavailable: false,
        });
        setMediaError(null);
        emitMediaState();
        return;
      }

      await recoverLocalMedia();
      const restoredTrack = useCallStore
        .getState()
        .localStream?.getVideoTracks()
        .find((track) => track.readyState === "live");
      if (restoredTrack) {
        restoredTrack.enabled = true;
        setCamOff(false);
        setMediaError(null);
      }
      emitMediaState();
    },
    [emitMediaState, recoverLocalMedia, setCamOff, setMediaError, setMediaPermissions],
  );

  const startCall = useCallback(
    async (targetUserId: string, type: CallType) => {
      let acquiredStream: MediaStream | null = null;

      try {
        setStatus("connecting");
        setRole("caller");
        setCallType(type);
        setPeerUser({ _id: targetUserId, name: "", avatar: "" });

        const result = await acquireLocalMedia(type);
        acquiredStream = result.stream;

        const connection = createPC();
        prepareSenders(connection, type, result.stream);
        setLocalStream(result.stream);

        const offer = await connection.createOffer();
        await connection.setLocalDescription(offer);

        const now = Date.now();
        const conversationId = useConversationStore.getState().activeId;
        setConversationId(conversationId);

        socket?.emit("webrtc:offer", {
          targetUserId,
          offer,
          callType: type,
          startedAt: now,
          conversationId,
        });
        setRingStartedAt(now);
        setStatus("calling");
        emitMediaState();
      } catch (err) {
        console.error("Start call failed:", err);
        acquiredStream?.getTracks().forEach((track) => track.stop());
        closePeerConnection(true);
        setStatus("idle");
        setLocalStream(null);
        setMediaError(getMediaErrorMessage(err, "audio"));
        throw err;
      }
    },
    [
      acquireLocalMedia,
      closePeerConnection,
      createPC,
      emitMediaState,
      prepareSenders,
      setCallType,
      setConversationId,
      setLocalStream,
      setMediaError,
      setPeerUser,
      setRingStartedAt,
      setRole,
      setStatus,
      socket,
    ],
  );

  const acceptCall = useCallback(async () => {
    const { incoming } = useCallStore.getState();
    if (!incoming) return;

    try {
      const type = callType ?? "audio";
      const result = await acquireLocalMedia(type);
      setLocalStream(result.stream);

      const connection = createPC(true);
      prepareSenders(connection, type, result.stream);
      setRole("callee");
      setPeerUser(incoming.from);

      await connection.setRemoteDescription(new RTCSessionDescription(incoming.offer));
      await flushIceQueue();

      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);

      socket?.emit("webrtc:answer", {
        targetUserId: incoming.from._id,
        answer,
      });
      setStatus("calling");
      emitMediaState();
    } catch (err) {
      console.error("Accept call failed:", err);
      setMediaError(getMediaErrorMessage(err, "audio"));
      throw err;
    }
  }, [
    acquireLocalMedia,
    callType,
    createPC,
    emitMediaState,
    flushIceQueue,
    prepareSenders,
    setLocalStream,
    setMediaError,
    setPeerUser,
    setRole,
    setStatus,
    socket,
  ]);

  const endCall = useCallback(() => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    const { localStream } = useCallStore.getState();
    localStream?.getTracks().forEach((track) => track.stop());

    closePeerConnection(true);

    setTimeout(() => {
      isEndingRef.current = false;
    }, 100);
  }, [closePeerConnection]);

  useEffect(() => {
    if (!socket) return;

    const onAnswer = async ({
      answer,
      peerUser,
    }: {
      answer: RTCSessionDescriptionInit;
      peerUser: User;
    }) => {
      if (pcOwnerRef.current !== instanceIdRef.current) return;

      const connection = pcRef.current;
      setPeerUser(peerUser);
      if (!connection || connection.signalingState !== "have-local-offer") {
        console.warn(`Skip answer. Current state: ${connection?.signalingState}`);
        return;
      }

      try {
        await connection.setRemoteDescription(new RTCSessionDescription(answer));
        await flushIceQueue();
      } catch (err) {
        console.error("Failed to set answer remote description:", err);
      }
    };

    const onIceCandidate = async ({
      candidate,
      fromUserId,
    }: {
      candidate: RTCIceCandidateInit;
      fromUserId?: string;
    }) => {
      if (!candidate) return;

      const { peerUser, incoming } = useCallStore.getState();
      const expectedPeerId = peerUser?._id ?? incoming?.from?._id;
      if (fromUserId && expectedPeerId && fromUserId !== expectedPeerId) return;

      const isOwner = pcOwnerRef.current === instanceIdRef.current;
      if (pcOwnerRef.current && !isOwner) return;

      const connection = isOwner ? pcRef.current : null;
      if (connection?.remoteDescription && connection.signalingState !== "closed") {
        try {
          await connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("addIceCandidate failed:", err);
        }
      } else {
        queueIceCandidate(candidate, fromUserId);
      }
    };

    socket.on("webrtc:answer", onAnswer);
    socket.on("webrtc:ice_candidate", onIceCandidate);

    return () => {
      socket.off("webrtc:answer", onAnswer);
      socket.off("webrtc:ice_candidate", onIceCandidate);
    };
  }, [flushIceQueue, queueIceCandidate, setPeerUser, socket]);

  useEffect(() => {
    const { status } = useCallStore.getState();
    if (status === "calling" || status === "connected") emitMediaState();
  }, [emitMediaState, mediaSignal]);

  useEffect(() => {
    const scheduleRecovery = () => {
      if (recoveryTimerRef.current) clearTimeout(recoveryTimerRef.current);
      recoveryTimerRef.current = setTimeout(() => {
        void recoverLocalMedia().catch(() => undefined);
      }, 500);
    };

    navigator.mediaDevices?.addEventListener?.("devicechange", scheduleRecovery);

    const watchPermissions = async () => {
      if (!navigator.permissions?.query) return;

      const permissionNames = ["camera", "microphone"] as PermissionName[];
      const statuses = await Promise.allSettled(
        permissionNames.map((name) => navigator.permissions.query({ name })),
      );

      permissionStatusRefs.current = statuses
        .filter((result): result is PromiseFulfilledResult<PermissionStatus> => result.status === "fulfilled")
        .map((result) => result.value);

      permissionStatusRefs.current.forEach((permissionStatus) => {
        permissionStatus.onchange = scheduleRecovery;
      });
    };

    void watchPermissions();

    return () => {
      if (recoveryTimerRef.current) clearTimeout(recoveryTimerRef.current);
      navigator.mediaDevices?.removeEventListener?.("devicechange", scheduleRecovery);
      permissionStatusRefs.current.forEach((permissionStatus) => {
        permissionStatus.onchange = null;
      });
      permissionStatusRefs.current = [];
    };
  }, [recoverLocalMedia]);

  useEffect(() => {
    return () => {
      closePeerConnection(false);
    };
  }, [closePeerConnection]);

  return useMemo(() => ({
    startCall,
    endCall,
    acceptCall,
    recoverLocalMedia,
    setCameraEnabled,
  }), [acceptCall, endCall, recoverLocalMedia, setCameraEnabled, startCall]);
}

export function WebRTCProvider({ children }: { children: ReactNode }) {
  const actions = useWebRTCController();

  return createElement(WebRTCContext.Provider, { value: actions }, children);
}

export function useWebRTC() {
  const actions = useContext(WebRTCContext);
  if (!actions) {
    throw new Error("useWebRTC must be used inside WebRTCProvider");
  }

  return actions;
}
