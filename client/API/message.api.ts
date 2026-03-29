import { AxiosInstance } from "axios";

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
    attachments: string[];
  }) => axiosPrivate.post("/messages/send", payload),

  uploadImages: (formData: FormData) =>
    axiosPrivate.post("/messages/upload-images", formData),
  uploadDocuments: (formData: FormData) =>
    axiosPrivate.post("/messages/upload-documents", formData),
});
