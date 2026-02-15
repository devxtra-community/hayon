"use client";
import React, { useState } from "react";
import { X, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/axios";
import { useToast } from "@/context/ToastContext";
import { changePasswordSchema } from "@hayon/schemas";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  if (!isOpen) return null;

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error when user starts typing
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation using Zod
    const result = changePasswordSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err: any) => {
        const path = err.path[0] as string;
        if (path) fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await api.patch("/profile/change-password", formData);
      showToast("success", "Password Updated", "Your password has been changed successfully.");
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to change password";
      const backendErrors = error.response?.data?.data;

      if (backendErrors && typeof backendErrors === "object") {
        const fieldErrors: Record<string, string> = {};
        Object.entries(backendErrors).forEach(([key, value]: [string, any]) => {
          fieldErrors[key] = value._errors?.[0] || value;
        });
        setErrors(fieldErrors);
      }

      showToast("error", "Update Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#318D62]/5 p-6 border-b border-[#318D62]/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#318D62]/10 flex items-center justify-center text-[#318D62]">
              <Lock size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  placeholder="Enter current password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={
                    errors.currentPassword ? "border-red-500 focus-visible:ring-red-500/20" : ""
                  }
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("current")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-red-500">{errors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={
                    errors.newPassword ? "border-red-500 focus-visible:ring-red-500/20" : ""
                  }
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("new")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={
                    errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500/20" : ""
                  }
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-full border-gray-200"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-full bg-[#318D62] hover:bg-[#287350] text-white"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
