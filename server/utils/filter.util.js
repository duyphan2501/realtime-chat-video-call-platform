const filterFieldUser = (user) => {
  if (!user) return {};
  return {
    _id: user._id,
    name: user.name,
    avatar: user.avatar,
    email: user.email,
  };
};

export { filterFieldUser };
