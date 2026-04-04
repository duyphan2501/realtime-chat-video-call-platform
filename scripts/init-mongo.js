db = db.getSiblingDB("chatapp");

// Tạo dữ liệu cho Users
db.users.insertMany([
  {
    name: "Duy Phan",
    email: "duyphan2501@gmail.com",
    password: "$2b$10$1HN43hBnFnN26XUP3m52i.dZSJlLysdZFxwivjdZwJrBEUfK.5alC",
    isVerified: true,
    status: "active",
  },
  {
    name: "Duy Neon",
    email: "duyneon09@gmail.com",
    password: "$2b$10$1HN43hBnFnN26XUP3m52i.dZSJlLysdZFxwivjdZwJrBEUfK.5alC",
    isVerified: true,
    status: "active",
  },
]);

// Lấy ID của 2 user vừa tạo để tạo Conversation
const user1 = db.users.findOne({ email: "duyphan2501@gmail.com" });
const user2 = db.users.findOne({ email: "duyneon09@gmail.com" });

if (user1 && user2) {
  db.conversations.insertOne({
    type: "direct",
    participants: [
      {
        user: user1._id,
        role: "member",
      },
      {
        user: user2._id,
        role: "member",
      },
    ],
  });
}
