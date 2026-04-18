import { useAPI } from "@/API/useAPI";
import { useFriendStore } from "@/store";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { User } from "@/types";

export const useFriendService = () => {
  const api = useAPI().user;
  const setFriends = useFriendStore((s) => s.setFriends);
  const setFriendRequests = useFriendStore((s) => s.setFriendRequests);

  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const loadFriends = useCallback(async () => {
    setIsLoadingFriends(true);
    try {
      const res = await api.getFriends();
      setFriends(res.data.friends ?? []);
    } catch {
      /* silent */
    } finally {
      setIsLoadingFriends(false);
    }
  }, [api, setFriends]);

  const loadFriendRequests = useCallback(async () => {
    try {
      const res = await api.getFriendRequests();
      setFriendRequests(res.data.friendRequests ?? []);
    } catch {
      /* silent */
    }
  }, [api, setFriendRequests]);

  const sendFriendRequest = useCallback(
    async (userId: string) => {
      await api.sendFriendRequest(userId);
    },
    [api],
  );

  const acceptFriendRequest = useCallback(
    async (userId: string) => {
      await api.acceptFriendRequest(userId);
      await loadFriends();
      await loadFriendRequests();
    },
    [api, loadFriends, loadFriendRequests],
  );

  const rejectFriendRequest = useCallback(
    async (userId: string) => {
      await api.rejectFriendRequest(userId);
      await loadFriendRequests();
    },
    [api, loadFriendRequests],
  );

  const unfriend = useCallback(
    async (userId: string) => {
      await api.unfriend(userId);
      await loadFriends();
    },
    [api, loadFriends],
  );

  const searchUsers = useCallback(
    async (q: string): Promise<User[]> => {
      if (!q.trim()) return [];
      setIsSearching(true);
      try {
        const res = await api.searchUsers(q);
        return res.data.users ?? [];
      } catch {
        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [api],
  );

  return {
    isLoadingFriends,
    isSearching,
    loadFriends,
    loadFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    unfriend,
    searchUsers,
  };
};

export const useSearchFriends = (searchTerm: string) => {
  const api = useAPI().user;

  const { data, isLoading } = useQuery({
    queryKey: ["friends", "search", searchTerm],
    queryFn: () =>
      api.searchOnlyFriends(searchTerm, 10).then((res) => res.data),
    enabled: !!searchTerm,
    staleTime: 1000 * 60 * 5, 
  });

  return { data, isLoading };
};
