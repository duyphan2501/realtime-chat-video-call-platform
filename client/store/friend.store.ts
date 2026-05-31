import { create } from "zustand";
import type { User } from "@/types";
import { isValidUser } from "@/utils/user.utils";

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

  setFriendRequests: (users) =>
    set({ friendRequests: users.filter(isValidUser) as User[] }),

  addFriendRequest: (user) =>
    set((s) => ({
      // Tránh trùng lặp
      friendRequests: !isValidUser(user)
        ? s.friendRequests
        : s.friendRequests.find((u) => u._id === user._id)
        ? s.friendRequests
        : [user, ...s.friendRequests],
    })),

  removeFriendRequest: (id) =>
    set((s) => ({
      friendRequests: s.friendRequests.filter((u) => u._id !== id),
    })),

  setFriends: (users) => set({ friends: users.filter(isValidUser) as User[] }),

  appendNewFriend: (user) =>
    set((s) => ({
      friends: isValidUser(user) ? [...s.friends, user] : s.friends,
    })),

  removeFriend: (userId) =>
    set((s) => ({
      friends: s.friends.filter((u) => u._id !== userId),
    })),
}));
