import { useAPI } from "@/API/useAPI";
import { CallType } from "@/types";

export const useCallService = () => {
  const api = useAPI().call;
  const rejectCall = async (payload: {
    targetUserId: string;
    ownerId: string | null;
    conversationId: string;
    type: CallType;
    status: string;
  }) => {
    try {
      await api.rejectCall(payload);
    } catch (error) {}
  };

  const endCall = async (payload: {
    targetUserId: string;
    ownerId: string | null;
    conversationId: string;
    type: CallType;
    duration: number;
  }) => {
    try {
      await api.endCall(payload);
    } catch (error) {}
  };

  return {
    rejectCall,
    endCall,
  };
};
