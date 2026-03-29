import { useAPI } from "@/API/useAPI";
import { useConversationStore } from "@/store";
import { useMutation } from "@tanstack/react-query";

export const useConversationService = () => {
  const api = useAPI().conversation;
  const { setConversations, setConvCursor } = useConversationStore();

  const getConversationsMutation = useMutation({
    mutationFn: (payload: {
      type: string;
      cursor: Date | null;
      lastId: string | null;
      limit: number;
    }) => api.getConversations(payload),
    onSuccess: (res) => {
      setConversations(res.data.data);
      setConvCursor(res.data.nextCursor);
    },
    onError: (error: any) => {
      console.error(error);
    },
  }); 

  const markAsRead = async (conversationId: string) => {
    try {
      useConversationStore.getState().markAsRead(conversationId);
      await api.markAsRead(conversationId);
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã xem:", error);
    }
  };

  return {
    getConversations: getConversationsMutation.mutateAsync,
    isFetchingConvs: getConversationsMutation.isPending,
    markAsRead,
  };
};
