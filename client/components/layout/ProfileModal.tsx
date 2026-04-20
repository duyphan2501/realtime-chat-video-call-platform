"use client";

import { useState, useEffect, useRef } from "react";
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
  Camera,
  Loader2,
} from "lucide-react";
import IconBtn from "../IconBtn";

interface Props {
  onClose: () => void;
  isEditable?: boolean;
  user?: any;
}

const ProfileModal = ({ onClose, isEditable = true, user }: Props) => {
  const currentUser = useAuthStore((s) => s.user);
  const displayUser = user || currentUser;
  const { updateProfile, isUpdatingProfile } = useAuthService();

  const [isEditing, setIsEditing] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: displayUser?.name || "",
    bio: displayUser?.bio || "",
    phone: displayUser?.phone || "",
    gender: (displayUser as any)?.gender || null,
    dob: (displayUser as any)?.dob
      ? new Date((displayUser as any).dob).toISOString().split("T")[0]
      : "",
  });

  useEffect(() => {
    if (displayUser) {
      setFormData({
        name: displayUser.name || "",
        bio: displayUser.bio || "",
        phone: displayUser.phone || "",
        gender: (displayUser as any).gender || null,
        dob: (displayUser as any).dob
          ? new Date((displayUser as any).dob).toISOString().split("T")[0]
          : "",
      });
    }
  }, [displayUser]);

  const getGenderLabel = (g: string | null) => {
    const labels: Record<string, string> = {
      male: "Male",
      female: "Female",
    };
    return labels[g || ""] || "Not updated";
  };

  const formatDOB = (d: string) =>
    d ? new Date(d).toLocaleDateString("en-US") : "Not updated";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "gender" && value === "" ? null : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable || displayUser._id !== currentUser?._id) return;
    try {
      await updateProfile({ ...formData, avatar: selectedAvatarFile });
      setIsEditing(false);
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 pointer-events-none">
        <div className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-[2.5rem] bg-[#181829] border border-white/5 shadow-2xl pointer-events-auto overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-white/10 bg-[#12121e]">
            <div className="flex items-center gap-3">
              {isEditing && (
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <h3 className="text-xl font-bold text-white">
                {isEditing ? "Edit Profile" : "Profile"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {!isEditing ? (
              <div className="space-y-8">
                {/* Info Display */}
                <div className="flex flex-col items-center">
                  <div className="w-28 h-28 rounded-[2.5rem] p-1 bg-gradient-to-tr from-[#2b2bee] to-purple-500 shadow-xl mb-4">
                    <img
                      src={getAvatar(displayUser)}
                      alt={displayUser.name}
                      className="w-full h-full rounded-[2.3rem] object-cover border-4 border-[#181829]"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    {displayUser.name}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1 italic">
                    {displayUser.bio || "No bio yet."}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">
                    Personal Information
                  </p>
                  <div className="bg-[#1c1c2e] rounded-[2rem] p-6 border border-white/5 space-y-5">
                    <InfoRow
                      icon={<User size={16} />}
                      label="Gender"
                      value={getGenderLabel(displayUser?.gender)}
                    />
                    <InfoRow
                      icon={<Calendar size={16} />}
                      label="DOB"
                      value={formatDOB(displayUser?.dob)}
                    />
                    <InfoRow
                      icon={<Phone size={16} />}
                      label="Phone"
                      value={displayUser?.phone || "Not updated"}
                    />
                    <InfoRow
                      icon={<Mail size={16} />}
                      label="Email"
                      value={displayUser?.email}
                    />
                  </div>
                </div>

                {isEditable && displayUser._id === currentUser?._id && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full py-4 rounded-2xl bg-[#2b2bee] text-white font-bold transition-all active:scale-[0.96] flex items-center justify-center gap-2 shadow-lg shadow-[#2b2bee]/20 hover:brightness-110"
                  >
                    <Edit size={18} /> Update Profile
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Edit Form */}
                <div className="flex flex-col items-center mb-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-2 border-dashed border-white/20 p-1">
                      <img
                        src={avatarPreview || getAvatar(displayUser)}
                        className="w-full h-full rounded-[1.8rem] object-cover"
                        alt="avatar"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 bg-[#2b2bee] p-2 rounded-xl border-4 border-[#181829] text-white shadow-lg"
                    >
                      <Camera size={16} />
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      ref={avatarInputRef}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <InputGroup
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="w-full bg-[#1c1c2e] text-white px-5 py-4 rounded-2xl outline-none border border-transparent focus:border-[#2b2bee]/50 transition-all text-sm resize-none h-24"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender || ""}
                        onChange={handleChange}
                        className="w-full bg-[#1c1c2e] text-white px-4 py-4 rounded-2xl outline-none border border-transparent focus:border-[#2b2bee]/50 transition-all text-sm appearance-none"
                      >
                        <option value="">Not set</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <InputGroup
                      label="DOB"
                      name="dob"
                      type="date"
                      value={formData.dob}
                      onChange={handleChange}
                    />
                  </div>
                  <InputGroup
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full py-4 rounded-2xl bg-[#2b2bee] text-white font-bold transition-all active:scale-[0.96] flex items-center justify-center gap-2 shadow-lg shadow-[#2b2bee]/20 hover:brightness-110 disabled:opacity-50"
                >
                  {isUpdatingProfile ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Save size={18} />
                  )}
                  Save Changes
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Helper Components
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-4">
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 shrink-0">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-bold text-slate-500 uppercase">{label}</p>
      <p className="text-sm text-slate-200 font-medium truncate">{value}</p>
    </div>
  </div>
);

const InputGroup = ({ label, ...props }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
      {label}
    </label>
    <input
      {...props}
      className="w-full bg-[#1c1c2e] text-white px-5 py-4 rounded-2xl outline-none border border-transparent focus:border-primary/50 transition-all text-sm font-medium"
    />
  </div>
);

export default ProfileModal;
