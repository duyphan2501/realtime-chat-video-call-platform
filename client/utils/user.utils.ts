const getAvatar = (user: { name: string; avatar?: string }) => {
  if (user.avatar) return user.avatar;
  if (!user.name)
    return "https://ui-avatars.com/api/?name=User&background=ccc&color=fff&bold=true";
  const colors = [
    "6366f1", // Light Indigo
    "5b21b6", // Soft Deep Purple
    "0369a1", // Deep Ocean Blue
    "0f766e", // Teal
    "374151", // Charcoal Gray
  ];

  const charCode = user.name.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.name,
  )}&background=${color}&color=fff&bold=true`;
};

export { getAvatar };
