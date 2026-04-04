export default (io, socket) => {
  socket.on(
    "webrtc:offer",
    ({ targetUserId, offer, callType, startedAt, conversationId }) => {
      const fromUser = socket.user;
      if (!fromUser) return;

      io.to(`user_${targetUserId}`).emit("call:incoming", {
        incoming: {
          from: fromUser,
          offer,
        },
        callType,
        startedAt,
        conversationId,
      });
    },
  );

  socket.on("webrtc:answer", ({ targetUserId, answer }) => {
    const peerUser = socket.user;
    if (!peerUser) return;

    io.to(`user_${targetUserId}`).emit("webrtc:answer", {
      answer,
      peerUser,
    });
  });

  socket.on("webrtc:ice_candidate", ({ targetUserId, candidate }) => {
    io.to(`user_${targetUserId}`).emit("webrtc:ice_candidate", { candidate });
  });
};
