/* ═══════════════════════════════════════════════════════════
   lib/api.ts
   Tất cả hàm gọi API đều được đánh dấu rõ ràng.
   Bạn chỉ cần đổi BASE_URL và kiểm tra lại shape
   response cho khớp với backend của mình.
   ═══════════════════════════════════════════════════════════ */

// TODO: đổi thành URL backend thực của bạn
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const getToken = () =>
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

/* ── Core fetch wrapper ─────────────────────────── */
async function req<T>(
  endpoint: string,
  opts: RequestInit & { isForm?: boolean } = {}
): Promise<T> {
  const { isForm, ...rest } = opts;
  const headers: Record<string, string> = isForm
    ? {}
    : { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${endpoint}`, {
    ...rest,
    headers: { ...headers, ...(rest.headers as Record<string, string>) },
    credentials: "include", // gửi cookie refreshToken
  });

  if (res.status === 401) {
    // TODO: gọi /auth/refresh để lấy accessToken mới, rồi retry
    localStorage.removeItem("accessToken");
    window.location.href = "/auth";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Lỗi không xác định" }));
    throw new Error(err.message);
  }
  return res.json();
}

/* ── Auth ────────────────────────────────────────
   TODO: kiểm tra response shape khớp với backend
   Backend hiện trả về: { accessToken, refreshToken, user, success }
   ─────────────────────────────────────────────── */
export const authApi = {
  login: (email: string, password: string) =>
    req<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (data: { fullName: string; email: string; password: string }) =>
    req<any>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    req("/auth/logout", { method: "POST" }),

  // TODO: implement refresh token flow
  refresh: (refreshToken: string) =>
    req<any>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
};

/* ── User ────────────────────────────────────────
   TODO: đảm bảo các route này tồn tại trong backend
   ─────────────────────────────────────────────── */
export const userApi = {
  getMe: () => req<any>("/users/me"),

  updateProfile: (formData: FormData) =>
    req<any>("/users/me", { method: "PUT", body: formData, isForm: true }),

  searchUsers: (q: string) =>
    req<any>(`/users/search?q=${encodeURIComponent(q)}`),

  getFriends: () => req<any>("/users/friends"),

  getFriendRequests: () => req<any>("/users/friend-requests"),

  sendFriendRequest: (userId: string) =>
    req<any>(`/users/friend-request/${userId}`, { method: "POST" }),

  acceptFriendRequest: (userId: string) =>
    req<any>(`/users/friend-request/${userId}/accept`, { method: "POST" }),

  rejectFriendRequest: (userId: string) =>
    req<any>(`/users/friend-request/${userId}/reject`, { method: "DELETE" }),

  unfriend: (userId: string) =>
    req<any>(`/users/friends/${userId}`, { method: "DELETE" }),
};

/* ── Conversation & Messages ─────────────────────
   TODO: đảm bảo shape pagination khớp với backend
   ─────────────────────────────────────────────── */
export const conversationApi = {
  getAll: () => req<any>("/conversations"),

  getMessages: (convId: string, page = 1, limit = 30) =>
    req<any>(`/conversations/${convId}/messages?page=${page}&limit=${limit}`),

  sendMessage: (convId: string, data: { content?: string; replyTo?: string }, files?: File[]) => {
    if (files?.length) {
      const fd = new FormData();
      if (data.content) fd.append("content", data.content);
      if (data.replyTo) fd.append("replyTo", data.replyTo);
      files.forEach((f) => fd.append("files", f));
      return req<any>(`/conversations/${convId}/messages`, {
        method: "POST",
        body: fd,
        isForm: true,
      });
    }
    return req<any>(`/conversations/${convId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  reactToMessage: (convId: string, msgId: string, emoji: string) =>
    req<any>(`/conversations/${convId}/messages/${msgId}/react`, {
      method: "POST",
      body: JSON.stringify({ emoji }),
    }),

  deleteMessage: (convId: string, msgId: string, forAll = false) =>
    req<any>(`/conversations/${convId}/messages/${msgId}?forAll=${forAll}`, {
      method: "DELETE",
    }),

  createGroup: (data: { name: string; memberIds: string[] }, avatar?: File) => {
    const fd = new FormData();
    fd.append("name", data.name);
    data.memberIds.forEach((id) => fd.append("memberIds", id));
    if (avatar) fd.append("avatar", avatar);
    return req<any>("/conversations/group", { method: "POST", body: fd, isForm: true });
  },

  addMembers: (convId: string, memberIds: string[]) =>
    req<any>(`/conversations/${convId}/members`, {
      method: "POST",
      body: JSON.stringify({ memberIds }),
    }),

  removeMember: (convId: string, userId: string) =>
    req<any>(`/conversations/${convId}/members/${userId}`, { method: "DELETE" }),
};
