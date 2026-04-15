"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store";
import { useAuthService } from "@/services";
import { getAvatar } from "@/utils/user.utils";
import {
  Calendar,
  Edit,
  Mail,
  Phone,
  User,
  X,
  Save,
  ArrowLeft,
} from "lucide-react";
import IconBtn from "../IconBtn";

interface Props {
  onClose: () => void;
}

const ProfileModal = ({ onClose }: Props) => {
  const currentUser = useAuthStore((s) => s.user);
  const { updateProfile, isUpdatingProfile } = useAuthService();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    bio: currentUser?.bio || "",
    phone: currentUser?.phone || "",
    gender: (currentUser as any)?.gender || "",
    dob: (currentUser as any)?.dob
      ? new Date((currentUser as any).dob).toISOString().split("T")[0]
      : "",
  });

  // Đồng bộ hóa formData với currentUser mỗi khi currentUser thay đổi
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || "",
        bio: currentUser.bio || "",
        phone: currentUser.phone || "",
        gender: (currentUser as any).gender || "",
        dob: (currentUser as any).dob
          ? new Date((currentUser as any).dob).toISOString().split("T")[0]
          : "",
      });
    }
  }, [currentUser]);

  const getGenderLabel = (g: string) => {
    if (g === "male") return "Nam";
    if (g === "female") return "Nữ";
    if (g === "other") return "Khác";
    return "Chưa cập nhật";
  };

  const formatDOB = (d: string) => {
    if (!d) return "Chưa cập nhật";
    return new Date(d).toLocaleDateString("vi-VN");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-dark-secondary! rounded-xl shadow-xl text-white w-full max-w-md p-6 relative animate-fade-in-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h3 className="text-lg font-bold">
              {isEditing ? "Cập nhật thông tin" : "Thông tin tài khoản"}
            </h3>
          </div>
          <IconBtn title="Close" onClick={onClose}>
            <X size={20} />
          </IconBtn>
        </div>

        {!isEditing ? (
          <>
            {/* User Header */}
            {currentUser && (
              <div className="flex flex-col items-center text-center mb-8">
                <img
                  src={getAvatar(currentUser)}
                  alt={currentUser.name}
                  className="w-24 h-24 rounded-full object-cover mb-4 ring-2 ring-primary/50"
                />
                <div>
                  <p className="font-bold text-2xl">{currentUser.name}</p>
                  <p className="text-sm text-gray-400">
                    {currentUser.bio || "Chưa có tiểu sử."}
                  </p>
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-300 border-b border-gray-700 pb-2">
                Thông tin cá nhân
              </h4>
              <div className="text-sm space-y-3 pt-2">
                <div className="flex items-center gap-4">
                  <User size={16} className="text-gray-500" />
                  <span className="text-gray-400 w-24">Giới tính</span>
                  <span className="text-white">
                    {getGenderLabel((currentUser as any)?.gender)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-gray-400 w-24">Ngày sinh</span>
                  <span className="text-white">
                    {formatDOB((currentUser as any)?.dob)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Phone size={16} className="text-gray-500" />
                  <span className="text-gray-400 w-24">Số điện thoại</span>
                  <span className="text-white">
                    {currentUser?.phone || "Chưa cập nhật"}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Mail size={16} className="text-gray-500" />
                  <span className="text-gray-400 w-24">Email</span>
                  <span className="text-white">{currentUser?.email}</span>
                </div>
              </div>
            </div>

            {/* Update Button */}
            <button
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center justify-center gap-3 py-3 mt-8 rounded-lg bg-primary/80 text-white hover:bg-primary transition-colors font-semibold"
            >
              <Edit size={16} />
              <span>Cập nhật</span>
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                Họ và tên
              </label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-dark-gray border border-gray-700 rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                Tiểu sử
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="w-full bg-dark-gray border border-gray-700 rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-colors resize-none h-20"
                placeholder="Giới thiệu đôi nét về bản thân..."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                Giới tính
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange as any}
                className="w-full bg-dark-gray border border-gray-700 rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-colors appearance-none"
              >
                <option value="">Chưa cập nhật</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                Ngày sinh
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full bg-dark-gray border border-gray-700 rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">
                Số điện thoại
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-dark-gray border border-gray-700 rounded-lg px-4 py-2.5 outline-none focus:border-primary transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="w-full flex items-center justify-center gap-2 py-3 mt-4 rounded-lg bg-primary/80 text-white hover:bg-primary transition-colors font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUpdatingProfile ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              <span>{isUpdatingProfile ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
