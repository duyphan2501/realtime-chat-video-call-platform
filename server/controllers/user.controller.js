import {UserModel} from "../models/index.js";
import createHttpError from "http-errors";
import { UserService } from "../services/index.js";

/* ═══════════════════════════════════════════════════════════
   GET /users/me
   ═══════════════════════════════════════════════════════════ */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (!userId) throw createHttpError.BadRequest("UserId is missing");

    const user = await UserModel.findById(userId).select("-password");
    if (!user) throw createHttpError.NotFound("User not found");

    res.status(200).json({ success: true, user });
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
    const { name, bio, phone } = req.body;

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { name, bio, phone },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) throw createHttpError.NotFound("User not found");

    res.status(200).json({ success: true, user: updatedUser });
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

    // Get current user's friend list to determine friendStatus
    const currentUser = await UserModel.findById(userId).select(
      "friends friendRequestsSent",
    );
    const friendIds = currentUser?.friends?.map((id) => id.toString()) || [];
    const sentToIds =
      currentUser?.friendRequestsSent?.map((r) => r.to?.toString()) || [];

    const usersWithStatus = users.map((user) => {
      const userObj = user.toObject();
      if (friendIds.includes(user._id.toString())) {
        userObj.friendStatus = "friend";
      } else if (sentToIds.includes(user._id.toString())) {
        userObj.friendStatus = "sent";
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

    const user = await UserModel.findById(userId)
      .populate("friends", "-password")
      .select("friends");

    res.status(200).json({
      success: true,
      friends: user?.friends || [],
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

    const user = await UserModel.findById(userId)
      .populate("friendRequestsReceived.from", "-password")
      .select("friendRequestsReceived");

    const requests = (user?.friendRequestsReceived || [])
      .map((req) => ({
        ...req.from?.toObject(),
        friendStatus: "received",
      }))
      .filter((r) => r._id);

    res.status(200).json({
      success: true,
      friendRequests: requests,
    });
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

    // Check if already friends
    if (targetUser.friends?.includes(userId)) {
      throw createHttpError.Conflict("Already friends");
    }

    // Check if request already sent
    const alreadySent = targetUser.friendRequestsReceived?.some(
      (req) => req.from?.toString() === userId,
    );
    if (alreadySent) {
      throw createHttpError.Conflict("Friend request already sent");
    }

    // Add to sent requests (current user)
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: {
        friendRequestsSent: { to: targetUserId, createdAt: new Date() },
      },
    });

    // Add to received requests (target user)
    await UserModel.findByIdAndUpdate(targetUserId, {
      $addToSet: {
        friendRequestsReceived: { from: userId, createdAt: new Date() },
      },
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

    // Remove from received requests
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { friendRequestsReceived: { from: senderId } },
    });

    // Add to friends both ways
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: { friends: senderId },
    });

    await UserModel.findByIdAndUpdate(senderId, {
      $addToSet: { friends: userId },
      $pull: { friendRequestsSent: { to: userId } },
    });

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

    // Remove from received requests
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { friendRequestsReceived: { from: senderId } },
    });

    // Remove from their sent requests
    await UserModel.findByIdAndUpdate(senderId, {
      $pull: { friendRequestsSent: { to: userId } },
    });

    res.status(200).json({ success: true, message: "Friend request rejected" });
  } catch (error) {
    next(error);
  }
};

/* ═══════════════════════════════════════════════════════════
   DELETE /users/friends/:userId — unfriend
   ═══════════════════════════════════════════════════════════ */
export const unfriend = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { userId: friendId } = req.params;

    if (!friendId)
      throw createHttpError.BadRequest("Friend user ID is required");

    // Remove from both users' friend lists
    await UserModel.findByIdAndUpdate(userId, {
      $pull: { friends: friendId },
    });

    await UserModel.findByIdAndUpdate(friendId, {
      $pull: { friends: userId },
    });

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
};
