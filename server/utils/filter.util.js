const filterFieldUser = (user) => {
  if (!user) return {};
  return {
    _id: user._id,
    name: user.name,
    phone: user.phone,
    avatar: user.avatar,
    email: user.email,
    isVerified: user.isVerified,
  };
};

export { filterFieldUser };
