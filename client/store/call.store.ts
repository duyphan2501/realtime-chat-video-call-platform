import { CallStatus, CallType, IncomingCall, User } from "@/types";
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

  setStatus: (s: CallStatus) => void;
  setCallType: (t: CallType | null) => void;
  setIncoming: (c: IncomingCall | null) => void;
  setPeerUser: (user: User | null) => void;
  toggleMute: () => void;
  toggleCam: () => void;
  setStartTime: (t: number | null) => void;
  setLocalStream: (s: MediaStream | null) => void;
  setRemoteStream: (s: MediaStream | null) => void;
  setRole: (r: "caller" | "callee" | null) => void;
  reset: () => void;
  setRingStartedAt: (t: number) => void;
  setConversationId: (id: string | null) => void;
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

  setStatus: (status) => set({ status }),
  setCallType: (callType) => set({ callType }),
  setIncoming: (incoming) => set({ incoming }),
  setPeerUser: (peerUser) => set({ peerUser }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleCam: () => set((s) => ({ isCamOff: !s.isCamOff })),
  setStartTime: (startTime) => set({ startTime }),
  setLocalStream: (localStream) => set({ localStream }),
  setRemoteStream: (remoteStream) => set({ remoteStream }),
  setRole: (r) => set({ role: r }),
  setRingStartedAt: (t) => set({ ringStartedAt: t }),
  setConversationId: (id) => set({ conversationId: id }),
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
    }),
}));
