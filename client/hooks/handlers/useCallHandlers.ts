import { useEffect, useRef } from "react";
import { useCallStore } from "@/store";
import type { Socket } from "socket.io-client";
import { CallStatus } from "@/types";

export function useCallHandlers(socket: Socket | null) {
  // Giữ ref đến timer để có thể clear khi cần
  const endedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onIncoming = (data: any) => {
      const call = useCallStore.getState();
      call.setIncoming(data.incoming);
      call.setConversationId(data.conversationId);
      call.setCallType(data.callType);
      call.setPeerUser(data.incoming.from);
      call.setStatus("ringing");
      call.setRingStartedAt(data.startedAt);
    };

    const onRejected = ({ reason }: { reason: CallStatus }) => {
      const { status, setStatus } = useCallStore.getState();
      if (status === "idle") return;
      setStatus(reason);
      if (endedTimerRef.current) clearTimeout(endedTimerRef.current);

      endedTimerRef.current = setTimeout(() => {
        useCallStore.getState().reset();
        endedTimerRef.current = null;
      }, 2000);
    };

    const onEnded = () => {
      // Clear timer cũ nếu event fire liên tiếp
      const { status, setStatus } = useCallStore.getState();
      if (status === "idle") return;
      setStatus("ended");
      if (endedTimerRef.current) clearTimeout(endedTimerRef.current);

      endedTimerRef.current = setTimeout(() => {
        useCallStore.getState().reset();
        endedTimerRef.current = null;
      }, 2000);
    };

    const onUserBusy = () => {
      useCallStore.getState().setStatus("busy");
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:rejected", onRejected);
    socket.on("call:ended", onEnded);
    socket.on("call:user_busy", onUserBusy);

    return () => {
      // Truyền đúng function reference — chỉ xóa listener của hook này
      socket.off("call:incoming", onIncoming);
      socket.off("call:rejected", onRejected);
      socket.off("call:ended", onEnded);
      socket.off("call:user_busy", onUserBusy);

      // Clear timer treo nếu component unmount giữa chừng
      if (endedTimerRef.current) {
        clearTimeout(endedTimerRef.current);
        endedTimerRef.current = null;
      }
    };
  }, [socket]);
}
