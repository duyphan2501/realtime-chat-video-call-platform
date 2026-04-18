import { UserModel, FriendshipModel } from "../models/index.js";
import createHttpError from "http-errors";
import { filterFieldUser } from "../utils/filter.util.js";
import { UserService } from "../services/index.js";

/* ═══════════════════════════════════════════════════════════
   GET /users/me
   ═══════════════════════════════════════════════════════════ */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (!userId) throw createHttpError.BadRequest("UserId is missing");

    const user = await UserModel.findById(userId);
    if (!user) throw createHttpError.NotFound("User not found");

    res.status(200).json({ success: true, user: filterFieldUser(user) });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   PUT /users/me — update profile
   ═══════════════════════════════════════════════════════════ */
export const updateMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { name, bio, phone, gender, dob } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { name, bio, phone, gender, dob },
      { new: true, runValidators: true },
    );

    if (!updatedUser) throw createHttpError.NotFound("User not found");

    res.status(200).json({ success: true, user: filterFieldUser(updatedUser) });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   GET /users/search?q=
   ═══════════════════════════════════════════════════════════ */
export const searchUsers = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.toString().trim() === "") {
      return res.status(200).json({ success: true, users: [] });
    }

    const searchQuery = {
      _id: { $ne: userId },
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    };

    const users = await UserModel.find(searchQuery)
      .select("-password")
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    // Get current user's friendships from FriendshipModel
    const friendships = await FriendshipModel.find({
      $or: [{ requester: userId }, { recipient: userId }],
    });

    const friendIds = friendships
      .filter((f) => f.status === "accepted")
      .map((f) => f.requester.toString() === userId.toString() ? f.recipient.toString() : f.requester.toString());

    const sentToIds = friendships
      .filter((f) => f.status === "pending" && f.requester.toString() === userId.toString())
      .map((f) => f.recipient.toString());

    const receivedFromIds = friendships
      .filter((f) => f.status === "pending" && f.recipient.toString() === userId.toString())
      .map((f) => f.requester.toString());

    const usersWithStatus = users.map((user) => {
      const userObj = user.toObject();
      const idStr = user._id.toString();
      if (friendIds.includes(idStr)) {
        userObj.friendStatus = "friend";
      } else if (sentToIds.includes(idStr)) {
        userObj.friendStatus = "sent";
      } else if (receivedFromIds.includes(idStr)) {
        userObj.friendStatus = "received";
      } else {
        userObj.friendStatus = "none";
      }
      return userObj;
    });

    res.status(200).json({ success: true, users: usersWithStatus });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   GET /users/friends
   ═══════════════════════════════════════════════════════════ */
export const getFriends = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const friendships = await FriendshipModel.find({
      $or: [{ requester: userId }, { recipient: userId }],
      status: "accepted",
    })
      .populate("requester", "-password")
      .populate("recipient", "-password");

    const friends = friendships.map((f) => {
      const friendDoc =
        f.requester._id.toString() === userId.toString() ? f.recipient : f.requester;
      return filterFieldUser(friendDoc);
    });

    res.status(200).json({
      success: true,
      friends,
    });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   GET /users/friend-requests
   ═══════════════════════════════════════════════════════════ */
export const getFriendRequests = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const requests = await FriendshipModel.find({
      $or: [{ recipient: userId }, { requester: userId }],
      status: "pending",
    })
      .populate("recipient", "-password")
      .populate("requester", "-password");

    const friendRequests = requests.map((item) => {
      // Nếu mình là recipient -> Đây là yêu cầu người khác gửi cho mình (Received)
      if (item.recipient._id.toString() === userId) {
        return {
          ...filterFieldUser(item.requester),
          friendStatus: "received",
          requestId: item._id
        };
      } 
      // Nếu mình là requester -> Đây là yêu cầu mình gửi đi (Sent)
      else {
        return {
          ...filterFieldUser(item.recipient),
          friendStatus: "sent",
          requestId: item._id
        };
      }
    }).filter(Boolean);

    res.status(200).json({ success: true, friendRequests });
  } catch (error) {
    next(error);
  }
};
/* ═══════════════════════════════════════════════════════════
   POST /users/friend-request/:userId
   ═══════════════════════════════════════════════════════════ */
export const sendFriendRequest = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { userId: targetUserId } = req.params;

    if (!targetUserId)
      throw createHttpError.BadRequest("Target user ID is required");
    if (userId === targetUserId) {
      throw createHttpError.BadRequest(
        "Cannot send friend request to yourself",
      );
    }

    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) throw createHttpError.NotFound("User not found");

    const existing = await FriendshipModel.findOne({
      $or: [
        { requester: userId, recipient: targetUserId },
        { requester: targetUserId, recipient: userId },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") throw createHttpError.Conflict("Already friends");
      throw createHttpError.Conflict("Friend request already exists");
    }

    await FriendshipModel.create({
      requester: userId,
      recipient: targetUserId,
      status: "pending",
    });

    res.status(200).json({ success: true, message: "Friend request sent" });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   POST /users/friend-request/:userId/accept
   ═══════════════════════════════════════════════════════════ */
export const acceptFriendRequest = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { userId: senderId } = req.params;

    if (!senderId)
      throw createHttpError.BadRequest("Sender user ID is required");

    const friendship = await FriendshipModel.findOneAndUpdate(
      { requester: senderId, recipient: userId, status: "pending" },
      { status: "accepted" },
      { new: true }
    );

    if (!friendship) throw createHttpError.NotFound("Friend request not found");

    res.status(200).json({ success: true, message: "Friend request accepted" });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   DELETE /users/friend-request/:userId/reject
   ═══════════════════════════════════════════════════════════ */
export const rejectFriendRequest = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { userId: senderId } = req.params;

    if (!senderId)
      throw createHttpError.BadRequest("Sender user ID is required");

    const deleted = await FriendshipModel.findOneAndDelete({
      requester: senderId,
      recipient: userId,
      status: "pending",
    });

    if (!deleted) throw createHttpError.NotFound("Friend request not found");

    res.status(200).json({ success: true, message: "Friend request rejected" });
  } catch (error) {
    next(error);
  }
};

const cancelFriendRequest = async(req, res, next) => {
  try {
    const userId = req.user.userId;
    const { userId: recipientId } = req.params;

    if (!recipientId)
      throw createHttpError.BadRequest("Sender user ID is required");

    const deleted = await FriendshipModel.findOneAndDelete({
      requester: userId,
      recipient: recipientId,
      status: "pending",
    });

    if (!deleted) throw createHttpError.NotFound("Friend request not found");

    res.status(200).json({ success: true, message: "Friend request cancled" });
  } catch (error) {
    next(error)
  }
}

/* ═══════════════════════════════════════════════════════════
   DELETE /users/friends/:userId — unfriend
   ═══════════════════════════════════════════════════════════ */
export const unfriend = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { userId: friendId } = req.params;

    if (!friendId)
      throw createHttpError.BadRequest("Friend user ID is required");

    const deleted = await FriendshipModel.findOneAndDelete({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId },
      ],
      status: "accepted",
    });

    if (!deleted) throw createHttpError.NotFound("Friendship not found");

    res.status(200).json({ success: true, message: "Unfriend successful" });
  } catch (error) {
    next(error);
  }
};

export const searchOnlyFriends = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { searchTerm, limit } = req.query;
    if (!searchTerm) {
      return res.status(400).json({ message: "Search term is required" });
    }
    const friends = await UserService.searchOnlyFriends(
      userId,
      searchTerm,
      parseInt(limit),
    );
    res.json(friends);
  } catch (error) {
    next(error);
  }
};

export const UserController = {
  getMe,
  updateMe,
  searchUsers,
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  unfriend,
  searchOnlyFriends,
  cancelFriendRequest
};
