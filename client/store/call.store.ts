import { CallStatus, CallType, IncomingCall } from "@/types";
import { create } from "zustand";

interface CallStore {
  status: CallStatus;
  callType: CallType | null;
  incoming: IncomingCall | null;
  peerSocketId: string | null;
  convId: string | null;
  isMuted: boolean;
  isCamOff: boolean;
  startTime: number | null;

  setStatus: (s: CallStatus) => void;
  setCallType: (t: CallType | null) => void;
  setIncoming: (c: IncomingCall | null) => void;
  setPeer: (id: string | null) => void;
  setConvId: (id: string | null) => void;
  toggleMute: () => void;
  toggleCam: () => void;
  setStartTime: (t: number | null) => void;
  reset: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  status: "ringing",
  callType: null,
  incoming: null,
  peerSocketId: null,
  convId: null,
  isMuted: false,
  isCamOff: false,
  startTime: null,

  setStatus: (status) => set({ status }),
  setCallType: (callType) => set({ callType }),
  setIncoming: (incoming) => set({ incoming }),
  setPeer: (peerSocketId) => set({ peerSocketId }),
  setConvId: (convId) => set({ convId }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleCam: () => set((s) => ({ isCamOff: !s.isCamOff })),
  setStartTime: (startTime) => set({ startTime }),
  reset: () =>
    set({
      status: "idle",
      callType: null,
      incoming: null,
      peerSocketId: null,
      convId: null,
      isMuted: false,
      isCamOff: false,
      startTime: null,
    }),
}));
