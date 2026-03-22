export default (io, socket) => {
  socket.on("join_conversation", (conversationId) => {
    socket.join(`conversation_${conversationId}`);
    console.log(`Socket ${socket.id} joined room: conversation_${conversationId}`);
  });

  socket.on("leave_conversation", (conversationId) => {
    socket.leave(`conversation_${conversationId}`);
  });
};