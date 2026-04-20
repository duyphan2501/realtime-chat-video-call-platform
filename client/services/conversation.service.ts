"use client";
import { useAPI } from "@/API/useAPI";
import { useConversationStore } from "@/store";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
// Xóa import { create } from "domain";
import toast from "react-hot-toast";

export const useGetInfiniteSharedContent = (
  conversationId: string,
  tab: "media" | "file",
) => {
  const convApi = useAPI().conversation;
  return useInfiniteQuery({
    queryKey: ["shared-content-infinite", conversationId, tab],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await convApi.getMedia({
        conversationId,
        tab,
        page: pageParam,
      });
      return res.data; // Trả về { data: [...], total, currentPage, totalPages }
    },
    getNextPageParam: (lastPage) => {
      // Nếu trang hiện tại chưa phải trang cuối thì trả về page tiếp theo
      return lastPage.currentPage < lastPage.totalPages
        ? lastPage.currentPage + 1
        : undefined;
    },
    initialPageParam: 1,
    enabled: !!conversationId,
  });
};

export const useConversationService = () => {
  const api = useAPI();
  const convApi = api.conversation;
  const uploadApi = api.upload;

  const {
    setConversations,
    setConvCursor,
    removeConversation,
    updateConversation,
  } = useConversationStore();

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
      const newConv = res.data.conversation || res.data.data || res.data;
      useConversationStore.getState().setActiveId(newConv._id);
    },

    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create group");
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (payload: {
      conversationId: string;
      name?: string;
      avatar?: File | null;
    }) => {
      const { conversationId, name, avatar } = payload;
      let uploadedAvatarUrl: string | null | undefined = undefined;

      if (avatar) {
        const formData = new FormData();
        formData.append("files", avatar);
        const { data } = await uploadApi.uploadImages(formData);
        if (data.uploadedImages?.[0]) {
          uploadedAvatarUrl = data.uploadedImages[0].url;
        }
      }

      const updateData: any = { name };
      // Only include avatar in update if it was provided
      if (uploadedAvatarUrl !== undefined) {
        updateData.avatar = uploadedAvatarUrl
          ? { url: uploadedAvatarUrl, publicId: "" }
          : null;
      }

      await convApi.updateGroup(conversationId, updateData);

      const updates: any = {};
      if (name) updates.name = name;
      if (uploadedAvatarUrl !== undefined) updates.avatar = uploadedAvatarUrl;
      updateConversation(conversationId, updates);
    },
    onSuccess: () => {
      toast.success("Group updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update group");
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (payload: {
      conversationId: string;
      userIds: string[];
    }) => {
      const results = [];
      for (const userId of payload.userIds) {
        const result = await convApi.addMemberToGroup(
          payload.conversationId,
          userId,
        );
        results.push(result);
      }
      return results;
    },
    onSuccess: (results, variables) => {
      const { conversationId, userIds } = variables;
      // Use the last response's conversation data (they should all be the same conversation)
      const lastResult = results[results.length - 1];
      if (lastResult?.data?.conversation) {
        updateConversation(conversationId, {
          participants: lastResult.data.conversation.participants,
        });
      }
      toast.success(`${userIds.length} member(s) added successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add members");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (payload: { conversationId: string; userId: string }) =>
      convApi.removeMemberFromGroup(payload.conversationId, payload.userId),
    onSuccess: (result, variables) => {
      const { conversationId, userId } = variables;
      if (result?.data?.conversation) {
        updateConversation(conversationId, {
          participants: result.data.conversation.participants,
        });
      }
      toast.success("Member removed from group");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to remove member");
    },
  });

  const makeAdminMutation = useMutation({
    mutationFn: (payload: { conversationId: string; userId: string }) =>
      convApi.makeAdmin(payload.conversationId, payload.userId),
    onSuccess: (result, variables) => {
      const { conversationId, userId } = variables;
      if (result?.data?.conversation) {
        updateConversation(conversationId, {
          participants: result.data.conversation.participants,
        });
      }
      toast.success("Member promoted to admin");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to make admin");
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: ({
      conversationId,
      newOwnerId,
    }: {
      conversationId: string;
      newOwnerId?: string;
    }) => convApi.leaveGroup(conversationId, newOwnerId),
    onSuccess: (_, { conversationId }) => {
      removeConversation(conversationId);
      toast.success("Left group successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to leave group");
    },
  });

  const disbandGroupMutation = useMutation({
    mutationFn: (conversationId: string) =>
      convApi.disbandGroup(conversationId),
    onSuccess: (_, conversationId) => {
      removeConversation(conversationId);
      toast.success("Group disbanded successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to disband group");
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
    updateGroup: updateGroupMutation.mutateAsync,
    addMembers: addMemberMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    makeAdmin: makeAdminMutation.mutateAsync,
    leaveGroup: leaveGroupMutation.mutateAsync,
    disbandGroup: disbandGroupMutation.mutateAsync,
    markAsRead,
    isFetchingConvs: getConversationsMutation.isPending,
    isCreatingConv: createConversationMutation.isPending,
    isUpdatingGroup: updateGroupMutation.isPending,
    isAddingMembers: addMemberMutation.isPending,
    isRemovingMember: removeMemberMutation.isPending,
    isMakingAdmin: makeAdminMutation.isPending,
    isLeavingGroup: leaveGroupMutation.isPending,
    isDisbandingGroup: disbandGroupMutation.isPending,
  };
};
