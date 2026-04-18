import { AxiosInstance } from "axios";

export const userAPI = (axiosPrivate: AxiosInstance) => ({
  /* ── Profile ──────────────────────────── */
  getMe: () =>
    axiosPrivate.get("/users/me"),
  updateMe: (data: { name?: string; bio?: string; phone?: string }) =>
    axiosPrivate.put("/users/me", data),

  /* ── Search ───────────────────────────── */
  searchUsers: (q: string, page = 1, limit = 20) =>
    axiosPrivate.get(`/users/search?q=${q}&page=${page}&limit=${limit}`),
  searchOnlyFriends: (query: string, limit = 10) =>
    axiosPrivate.get(`/users/search/friends?searchTerm=${query}&limit=${limit}`),

  /* ── Friends ──────────────────────────── */
  getFriends: () =>
    axiosPrivate.get("/users/friends"),
  getFriendRequests: () =>
    axiosPrivate.get("/users/friend-requests"),

  /* ── Friend Request Actions ───────────── */
  sendFriendRequest: (userId: string) =>
    axiosPrivate.post(`/users/friend-request/${userId}`),
  acceptFriendRequest: (userId: string) =>
    axiosPrivate.post(`/users/friend-request/${userId}/accept`),
  rejectFriendRequest: (userId: string) =>
    axiosPrivate.delete(`/users/friend-request/${userId}/reject`),

  /* ── Unfriend ─────────────────────────── */
  unfriend: (userId: string) =>
    axiosPrivate.delete(`/users/friends/${userId}`),
});
