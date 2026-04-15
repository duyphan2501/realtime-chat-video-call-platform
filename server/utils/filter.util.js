const filterFieldUser = (user) => {
  if (!user) return null;
  const userObject = user.toObject ? user.toObject() : { ...user };

  delete userObject.password;
  delete userObject.refreshToken;
  delete userObject.refreshTokenExpireAt;
  delete userObject.verificationToken;
  delete userObject.verificationTokenExpireAt;
  delete userObject.forgotPasswordToken;
  delete userObject.forgotPasswordTokenExpireAt;
  delete userObject.__v;

  return userObject;
};

export { filterFieldUser };