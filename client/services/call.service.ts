import { useAPI } from "@/API/useAPI";

export const useCallService = () => {
  const api = useAPI().call;

  const rejectCall = async (status: string = "rejected") => {
    try {
      await api.rejectCall({ status });
    } catch (error) {
      console.error("Failed to reject call", error);
    }
  };

  const endCall = async () => {
    try {
      await api.endCall();
    } catch (error) {
      console.error("Failed to end call", error);
    }
  };

  return {
    rejectCall,
    endCall,
  };
};
