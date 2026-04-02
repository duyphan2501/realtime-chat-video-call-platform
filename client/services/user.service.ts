// --- useFriendService.ts ---

import { useAPI } from "@/API/useAPI";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useSearchFriends = (searchTerm: string) => {
  const api = useAPI().user;

  return useQuery({
    queryKey: ["friends", "search", searchTerm],
    queryFn: () =>
      api.searchOnlyFriends(searchTerm, 10).then((res) => res.data),
    enabled: !!searchTerm,
    staleTime: 1000 * 60 * 5, // Cache 5 phút
  });
};

export const useUserActions = () => {
  const api = useAPI().user;
  const queryClient = useQueryClient();

  const addFriendMutation = useMutation({
    // mutationFn: (id: string) => api.sendRequest(id),
    onSuccess: () => {
      // Làm mới danh sách lời mời ngay khi gửi thành công
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });

  const acceptFriendMutation = useMutation({
    // mutationFn: (id: string) => api.acceptRequest(id),
    onSuccess: () => {
      // Làm mới cả list bạn bè và list lời mời
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
    },
  });

  return {
    addFriend: addFriendMutation.mutate,
    isAdding: addFriendMutation.isPending,
    acceptFriend: acceptFriendMutation.mutate,
    isAccepting: acceptFriendMutation.isPending,
  };
};
