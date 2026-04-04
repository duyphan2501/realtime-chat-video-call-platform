import { CallType } from "@/types";
import { AxiosInstance } from "axios";

export const callAPI = (axiosPrivate: AxiosInstance) => ({
  rejectCall: (payload: {
    targetUserId: string;
    ownerId: string | null;
    conversationId: string;
    type: CallType;
    status: string;
  }) => axiosPrivate.post(`/calls/${payload.conversationId}/reject`, payload),
  endCall: (payload: {
    targetUserId: string;
    ownerId: string | null;
    conversationId: string;
    type: CallType;
    duration: number;
  }) => axiosPrivate.post(`/calls/${payload.conversationId}/end`, payload),
});
