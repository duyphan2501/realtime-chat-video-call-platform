import { useAPI } from "@/API/useAPI";
import { useConversationStore, useMessageStore } from "@/store";
import type { Attachment, Message } from "@/types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

type SendMessagePayload = {
  conversationId: string;
  content: string;
  files: File[];
  tempId: string;
  replyTo?: string;
};

export const useMessageService = () => {
  const api = useAPI().message;
  const uploadApi = useAPI().upload;
  const queryClient = useQueryClient();

  const { messages, meta, setMessages, prependMessages, addMessage } =
    useMessageStore((s) => s);

  // Mutation để lấy tin nhắn (Load lần đầu hoặc Load more)
  const getMessagesMutation = useMutation({
    mutationFn: (payload: {
      conversationId: string;
      cursor: string | null;
      limit: number;
    }) => api.getMessages(payload),

    onSuccess: (res, variables) => {
      const { data, nextCursor, hasMore } = res.data;
      const { conversationId, cursor } = variables;

      if (!cursor) {
        const messages = data.reverse(); // Đảo ngược để hiển thị đúng thứ tự
        setMessages(conversationId, messages, hasMore, nextCursor);
      } else {
        prependMessages(conversationId, data, hasMore, nextCursor);
      }
    },
    onError: (error: unknown) => {
      console.error("Lỗi khi lấy tin nhắn:", error);
    },
  });

  const fetchMessages = async (conversationId: string, isLoadMore = false) => {
    const currentMeta = meta[conversationId];
    const currentMsgs = messages[conversationId] || [];

    if (!isLoadMore && currentMsgs.length > 0 && currentMeta) {
      return;
    }

    if (isLoadMore && currentMeta?.hasMore === false) {
      return;
    }

    await getMessagesMutation.mutateAsync({
      conversationId,
      cursor: isLoadMore ? currentMeta?.nextCursor : null,
      limit: 20,
    });
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const { content, files, conversationId, tempId } = payload;
      const attachments: Attachment[] = [];
      let type = "text";

      // 1. Logic Upload Hỗn Hợp (Tự động tách bên trong)
      if (files.length > 0) {
        const images = files.filter((f) => f.type.startsWith("image/"));
        const docs = files.filter((f) => !f.type.startsWith("image/"));
        const imgsLength = images.length;
        const docsLength = docs.length;

        if (docsLength > 0) type = "file";
        else if (imgsLength > 0) type = "image";

        // Chạy song song nhưng đợi cả 2 xong
        const [imgRes, docRes] = await Promise.all([
          images.length > 0
            ? uploadApi.uploadImages(createFormData(images))
            : null,
          docs.length > 0
            ? uploadApi.uploadDocuments(createFormData(docs))
            : null,
        ]);

        if (imgRes) attachments.push(...imgRes.data.uploadedImages);
        if (docRes) attachments.push(...docRes.data.uploadedDocuments);
      }

      // 2. Gửi tin nhắn cuối cùng
      return api.sendMessage({
        conversationId,
        content,
        attachments,
        tempId,
        type,
      });
    },

    onSuccess: (res) => {
      const newMessage = res.data.data as Message;
      useConversationStore.getState().bumpConversation(newMessage, 0);
      addMessage(newMessage);
      if ((newMessage.attachments?.length ?? 0) > 0) {
        // Ép phần Info tải lại dữ liệu mới
        queryClient.invalidateQueries({
          queryKey: ["shared-content-infinite", newMessage.conversation],
        });
      }
    },
    onError: (error: unknown, variables: SendMessagePayload) => {
      const { tempId } = variables;
      useMessageStore.getState().updateMessageStatus(tempId, "failed");
      console.group("🔴 LỖI GỬI TIN NHẮN (SEND MESSAGE ERROR)");
      toast.error(getErrorMessage(error));
      console.groupEnd();
      console.error("Lỗi khi gửi tin nhắn:", error);
    },
  });

  const createFormData = (fileList: File[]) => {
    const fd = new FormData();
    fileList.forEach((f: File) => fd.append("files", f));
    return fd;
  };

  return {
    fetchMessages,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    isLoading: getMessagesMutation.isPending,
    messages,
    meta,
  };
};

const getErrorMessage = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return "Failed to send message";
};
