const UNKNOWN_USER_NAME = "Unknown User";

const getUserName = (user?: { name?: string | null } | null) =>
  user?.name?.trim() || UNKNOWN_USER_NAME;

const isValidUser = (
  user: unknown,
): user is { _id: string; name?: string | null; avatar?: string | null } =>
  !!user &&
  typeof user === "object" &&
  typeof (user as { _id?: unknown })._id === "string";

const getAvatar = (user?: { name?: string | null; avatar?: string | null } | null) => {
  if (user?.avatar) return user.avatar;
  const name = getUserName(user);
  if (!name)
    return "https://ui-avatars.com/api/?name=User&background=ccc&color=fff&bold=true";
  const colors = [
    "6366f1", // Light Indigo
    "5b21b6", // Soft Deep Purple
    "0369a1", // Deep Ocean Blue
    "0f766e", // Teal
    "374151", // Charcoal Gray
  ];

  const charCode = name.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name,
  )}&background=${color}&color=fff&bold=true`;
};

export { getAvatar, getUserName, isValidUser, UNKNOWN_USER_NAME };
