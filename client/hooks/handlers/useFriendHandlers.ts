import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { useFriendStore } from "@/store";
import { useFriendService } from "@/services";

export function useFriendHandlers(socket: Socket | null) {
  const {
    addFriendRequest,
    removeFriendRequest,
    appendNewFriend,
    removeFriend,
  } = useFriendStore();

  useEffect(() => {
    if (!socket) return;

    // 1. Khi có người khác gửi yêu cầu kết bạn cho bạn
    socket.on("new_friend_request", (data: { sender: any }) => {
      // data.sender phải chứa friendStatus: "received" từ backend
      addFriendRequest({ ...data.sender, friendStatus: "received" });
    });

    // 2. Khi người bạn đã gửi yêu cầu "Hủy" hoặc "Từ chối"
    socket.on("friend_request_cancelled", (data: { userId: string }) => {
      removeFriendRequest(data.userId);
    });

    // 3. Khi đối phương chấp nhận lời mời của bạn
    socket.on("friend_request_accepted", (data: { user: any }) => {
      removeFriendRequest(data.user._id); // Xóa khỏi danh sách chờ (sent)
      appendNewFriend(data.user);
    });

    socket.on("unfriend", (data: { userId: string }) => {
        removeFriend(data.userId)
    });

    return () => {
      socket.off("new_friend_request");
      socket.off("friend_request_cancelled");
      socket.off("friend_request_accepted");
      socket.off("unfriend");
    };
  }, [socket, addFriendRequest, removeFriendRequest]);
}
