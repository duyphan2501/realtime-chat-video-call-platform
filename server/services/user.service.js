import { FriendshipModel } from "../models/friendShip.model.js";
import UserModel from "../models/user.model.js";

const getFriends = async (userId) => {
  const friends = await FriendModel.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: "accepted",
  })
    .populate("requester", "name email avatar")
    .populate("recipient", "name email avatar")
    .lean();

  return friends.map((friend) => {
    const isRequester = friend.requester._id.toString() === userId.toString();
    return {
      _id: friend._id,
      friend: isRequester ? friend.recipient : friend.requester,
      status: friend.status,
    };
  });
};

// Giả sử bạn có model Friendship lưu { requester, recipient, status: 'accepted' }

const searchOnlyFriends = async (userId, searchTerm, limit=10) => {
  const friendships = await FriendshipModel.find({
    $or: [{ requester: userId }, { recipient: userId }],
    status: "accepted",
  }).lean();

  const friendIds = friendships.map((f) =>
    f.requester.toString() === userId.toString() ? f.recipient : f.requester,
  );

  const friends = await UserModel.find({
    _id: { $in: friendIds },
    $or: [
      { name: { $regex: searchTerm, $options: "i" } },
      { email: { $regex: searchTerm, $options: "i" } },
    ],
  })
    .select("_id name email avatar status")
    .limit(limit)
    .lean();

  return friends;
};


export const UserService = {
  getFriends,
  searchOnlyFriends,
};