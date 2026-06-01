import { AxiosInstance } from "axios";
import type { Attachment } from "@/types";

export const messageAPI = (axiosPrivate: AxiosInstance) => ({
  getMessages: ({
    conversationId,
    cursor,
    limit = 20,
  }: {
    conversationId: string;
    cursor: string | null;
    limit: number;
  }) =>
    axiosPrivate.get(
      `/messages/${conversationId}?cursor=${cursor}&limit=${limit}`,
    ),

  sendMessage: (payload: {
    conversationId: string;
    content: string;
    type: string;
    tempId: string;
    attachments: Attachment[];
  }) => axiosPrivate.post("/messages/send", payload),
});
