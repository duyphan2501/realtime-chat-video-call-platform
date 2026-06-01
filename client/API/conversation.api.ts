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
  removeConversation: (conversationId: string) =>
    axiosPrivate.delete(`/conversations/${conversationId}`),
  createConversation: (payload: {
    participantIds: string[];
    type: string;
    name?: string;
    avatar?: { url: string; publicId: string };
  }) => axiosPrivate.post("/conversations/create", payload),

  getMedia: (payload: {
    conversationId: string;
    tab: "media" | "file";
    page: number;
    limit?: number;
  }) =>
    axiosPrivate.get(
      `/conversations/${payload.conversationId}/media?limit=${payload.limit}&page=${payload.page}&tab=${payload.tab}`,
    ),

  updateGroup: (
    conversationId: string,
    payload: {
      name?: string;
      avatar?: { url: string; publicId: string } | null;
    },
  ) => axiosPrivate.put(`/conversations/${conversationId}`, payload),

  addMemberToGroup: (conversationId: string, userId: string) =>
    axiosPrivate.post(`/conversations/${conversationId}/members/add`, {
      userId,
    }),

  removeMemberFromGroup: (conversationId: string, userId: string) =>
    axiosPrivate.post(`/conversations/${conversationId}/members/remove`, {
      userId,
    }),

  makeAdmin: (conversationId: string, userId: string) =>
    axiosPrivate.post(
      `/conversations/${conversationId}/members/${userId}/make-admin`,
    ),

  removeAdmin: (conversationId: string, userId: string) =>
    axiosPrivate.post(
      `/conversations/${conversationId}/members/${userId}/remove-admin`,
    ),

  leaveGroup: (conversationId: string, newOwnerId?: string) =>
    axiosPrivate.post(`/conversations/${conversationId}/leave`, {
      ...(newOwnerId && { newOwnerId }),
    }),

  disbandGroup: (conversationId: string) =>
    axiosPrivate.post(`/conversations/${conversationId}/disband`),
});
