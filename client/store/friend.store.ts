import { create } from "zustand";
import type { User } from "@/types";

interface FriendState {
  friendRequests: User[];
  friends: User[];

  // Actions
  setFriendRequests: (users: User[]) => void;
  addFriendRequest: (user: User) => void;
  removeFriendRequest: (userId: string) => void;
  setFriends: (users: User[]) => void;
  appendNewFriend: (user: User) => void;
  removeFriend: (userId: string) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  friendRequests: [],
  friends: [],

  setFriendRequests: (users) => set({ friendRequests: users }),

  addFriendRequest: (user) =>
    set((s) => ({
      // Tránh trùng lặp
      friendRequests: s.friendRequests.find((u) => u._id === user._id)
        ? s.friendRequests
        : [user, ...s.friendRequests],
    })),

  removeFriendRequest: (id) =>
    set((s) => ({
      friendRequests: s.friendRequests.filter((u) => u._id !== id),
    })),

  setFriends: (users) => set({ friends: users }),

  appendNewFriend: (user) =>
    set((s) => ({
      friends: [...s.friends, user],
    })),

  removeFriend: (userId) =>
    set((s) => ({
      friends: s.friends.filter((u) => u._id !== userId),
    })),
}));
