db = db.getSiblingDB("chatapp");

db.users.insertMany([
  {
    name: "Duy Phan",
    email: "duyphan2501@gmail.com",
    password: "$2b$10$1HN43hBnFnN26XUP3m52i.dZSJlLysdZFxwivjdZwJrBEUfK.5alC",
    isVerified: true,
    status: "active",
  },
  {
    name: "Hien Li",
    email: "chinhhien123@gmail.com",
    password: "$2b$10$1HN43hBnFnN26XUP3m52i.dZSJlLysdZFxwivjdZwJrBEUfK.5alC",
    isVerified: true,
    status: "active",
  },
  {
    name: "Cuong Dinh",
    email: "cuongdinh123@gmail.com",
    password: "$2b$10$1HN43hBnFnN26XUP3m52i.dZSJlLysdZFxwivjdZwJrBEUfK.5alC",
    isVerified: true,
    status: "active",
  },
]);

const user1 = db.users.findOne({ email: "duyphan2501@gmail.com" });
const user2 = db.users.findOne({ email: "chinhhien123@gmail.com" });

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
