"use client";
import { useAPI } from "@/API/useAPI";
import { useConversationStore } from "@/store";
import { useMutation } from "@tanstack/react-query";
// Xóa import { create } from "domain";
import toast from "react-hot-toast";

export const useConversationService = () => {
  const api = useAPI();
  const convApi = api.conversation;
  const uploadApi = api.upload;

  const { setConversations, setConvCursor } = useConversationStore();

  const getConversationsMutation = useMutation({
    mutationFn: (payload: {
      type: string;
      cursor: Date | null;
      lastId: string | null;
      limit: number;
    }) => convApi.getConversations(payload),
    onSuccess: (res) => {
      setConversations(res.data.data);
      setConvCursor(res.data.nextCursor);
    },
  });

  const createConversationMutation = useMutation({
    mutationFn: async (payload: {
      type: string;
      participantIds: string[];
      avatar?: File | null;
      name?: string;
    }) => {
      const { participantIds, type, name, avatar } = payload;

      let uploadedAvatar = { url: "", publicId: "" };

      if (avatar) {
        const formData = new FormData();
        formData.append("files", avatar);

        const { data } = await uploadApi.uploadImages(formData);

        if (data.uploadedImages?.[0]) {
          uploadedAvatar = {
            url: data.uploadedImages[0].url,
            publicId: data.uploadedImages[0].publicId,
          };
        }
      }

      return convApi.createConversation({
        participantIds,
        type,
        name,
        avatar: uploadedAvatar,
      });
    },

    onSuccess: (res) => {
      // res.data.data tùy thuộc vào cấu trúc backend trả về, hãy check lại
      const newConv = res.data.data || res.data;
      useConversationStore.getState().setActiveId(newConv._id);
      toast.success("Group created successfully");
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create group");
    },
  });

  const markAsRead = async (conversationId: string) => {
    try {
      useConversationStore.getState().markAsRead(conversationId);
      await convApi.markAsRead(conversationId);
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã xem:", error);
    }
  };

  return {
    getConversations: getConversationsMutation.mutateAsync,
    createConversation: createConversationMutation.mutateAsync,
    isFetchingConvs: getConversationsMutation.isPending,
    isCreatingConv: createConversationMutation.isPending,
    markAsRead,
  };
};
