import { AxiosInstance } from "axios";

export const callAPI = (axiosPrivate: AxiosInstance) => ({
  rejectCall: (payload?: { status: string }) => 
    axiosPrivate.post(`/calls/reject`, payload),
    
  endCall: () => 
    axiosPrivate.post(`/calls/end`),
});