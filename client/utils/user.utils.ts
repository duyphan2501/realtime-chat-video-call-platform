
const getAvatar = (user: { name: string; avatar?: string }) => {
  if (user.avatar) return user.avatar;
  if (!user.name) return "https://ui-avatars.com/api/?name=User&background=ccc&color=fff&bold=true";
  const colors = [
    "6366f1", // Indigo nhẹ
    "5b21b6", // Tím đậm dịu
    "0369a1", // Xanh biển sâu
    "0f766e", // Xanh teal
    "374151", // Xám than
  ];

  const charCode = user.name.charCodeAt(0) || 0;
  const color = colors[charCode % colors.length];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user.name
  )}&background=${color}&color=fff&bold=true`;
};


export { getAvatar };