import { Socket } from "socket.io-client";
import { create } from "zustand";

interface SocketStore {
  socket:       Socket | null;
  isConnected:  boolean;
  setSocket:    (s: Socket | null) => void;
  setConnected: (v: boolean) => void;
}

export const useSocketStore = create<SocketStore>((set) => ({
  socket:       null,
  isConnected:  false,
  setSocket:    (socket)      => set({ socket }),
  setConnected: (isConnected) => set({ isConnected }),
}));