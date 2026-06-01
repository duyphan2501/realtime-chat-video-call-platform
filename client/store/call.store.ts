import { CallMediaState, CallStatus, CallType, IncomingCall, User } from "@/types";
import { create } from "zustand";

interface CallStore {
  status: CallStatus;
  callType: CallType | null;
  incoming: IncomingCall | null;
  peerUser: User | null;
  isMuted: boolean;
  isCamOff: boolean;
  startTime: number | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  role: "caller" | "callee" | null;
  ringStartedAt: number | null;
  conversationId: string | null;
  mediaError: string | null;
  isRecoveringMedia: boolean;
  hasAudioPermission: boolean;
  hasVideoPermission: boolean;
  isCameraUnavailable: boolean;
  peerMediaState: CallMediaState | null;

  setStatus: (s: CallStatus) => void;
  setCallType: (t: CallType | null) => void;
  setIncoming: (c: IncomingCall | null) => void;
  setPeerUser: (user: User | null) => void;
  toggleMute: () => void;
  toggleCam: () => void;
  setMuted: (isMuted: boolean) => void;
  setCamOff: (isCamOff: boolean) => void;
  setStartTime: (t: number | null) => void;
  setLocalStream: (s: MediaStream | null) => void;
  setRemoteStream: (s: MediaStream | null) => void;
  setRole: (r: "caller" | "callee" | null) => void;
  reset: () => void;
  setRingStartedAt: (t: number) => void;
  setConversationId: (id: string | null) => void;
  setMediaError: (error: string | null) => void;
  setRecoveringMedia: (isRecoveringMedia: boolean) => void;
  setMediaPermissions: (permissions: {
    hasAudioPermission?: boolean;
    hasVideoPermission?: boolean;
    isCameraUnavailable?: boolean;
  }) => void;
  clearMediaState: () => void;
  setPeerMediaState: (state: CallMediaState | null) => void;
}

export const useCallStore = create<CallStore>((set) => ({
  status: "idle",
  callType: null,
  incoming: null,
  peerUser: null,
  isMuted: false,
  isCamOff: false,
  startTime: null,
  localStream: null,
  remoteStream: null,
  conversationId: null,
  role: null,
  ringStartedAt: null,
  mediaError: null,
  isRecoveringMedia: false,
  hasAudioPermission: false,
  hasVideoPermission: false,
  isCameraUnavailable: false,
  peerMediaState: null,

  setStatus: (status) => set({ status }),
  setCallType: (callType) => set({ callType }),
  setIncoming: (incoming) => set({ incoming }),
  setPeerUser: (peerUser) => set({ peerUser }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleCam: () => set((s) => ({ isCamOff: !s.isCamOff })),
  setMuted: (isMuted) => set({ isMuted }),
  setCamOff: (isCamOff) => set({ isCamOff }),
  setStartTime: (startTime) => set({ startTime }),
  setLocalStream: (localStream) => set({ localStream }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setRole: (r) => set({ role: r }),
  setRingStartedAt: (t) => set({ ringStartedAt: t }),
  setConversationId: (id) => set({ conversationId: id }),
  setMediaError: (mediaError) => set({ mediaError }),
  setRecoveringMedia: (isRecoveringMedia) => set({ isRecoveringMedia }),
  setMediaPermissions: (permissions) => set(permissions),
  clearMediaState: () =>
    set({
      mediaError: null,
      isRecoveringMedia: false,
      hasAudioPermission: false,
      hasVideoPermission: false,
      isCameraUnavailable: false,
      peerMediaState: null,
    }),
  setPeerMediaState: (peerMediaState) => set({ peerMediaState }),
  reset: () =>
    set({
      status: "idle",
      callType: null,
      incoming: null,
      peerUser: null,
      isMuted: false,
      isCamOff: false,
      startTime: null,
      localStream: null,
      remoteStream: null,
      role: null,
      conversationId: null,
      mediaError: null,
      isRecoveringMedia: false,
      hasAudioPermission: false,
      hasVideoPermission: false,
      isCameraUnavailable: false,
      peerMediaState: null,
    }),
}));
