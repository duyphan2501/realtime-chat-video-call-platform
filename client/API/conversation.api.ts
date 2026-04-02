import { AxiosInstance } from "axios";

export const conversationAPI = (axiosPrivate: AxiosInstance) => ({
  getConversations: ({
    type,
    cursor,
    lastId,
    limit = 10,
  }: {
    type: string;
    cursor: Date | null;
    lastId: string | null;
    limit: number;
  }) =>
    axiosPrivate.get(
      `/conversations?type=${type}&cursor=${cursor}&lastId=${lastId}&limit=${limit}`,
    ),
  markAsRead: (conversationId: string) =>
    axiosPrivate.post(`/conversations/${conversationId}/read`),
  createConversation: (payload: {
    participantIds: string[];
    type: string;
    name?: string;
    avatar?: { url: string; publicId: string };
  }) => axiosPrivate.post("/conversations/create", payload),
});
