"use client";

import { useEffect, useState, useRef } from "react";
import { api, clearAccessToken } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { AdminSidebar, AdminHeader } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Camera, Bell, Shield, LogOut, Lock, Monitor } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import DeviceList from "@/components/DeviceList";
import Image from "next/image";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar: string;
}

export default function AdminSettingsPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [showDevices, setShowDevices] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [update, setUpdate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewImgRef = useRef<HTMLImageElement>(null);

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    newUserAlerts: true,
    securityAlerts: true,
    weeklyReports: false,
  });

  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.data.user);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();
  }, [update]);

  const handleLogout = async () => {
    try {
      await api.delete("/auth/logout");
      clearAccessToken();
      router.push("/login");
    } catch (error) {
      console.error(error);
      showToast("error", "Logout failed", "Please try again.");
    }
  };

  const handleUpdateAvatar = () => {
    setIsAvatarMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setZoom(1);
  };

  const getProcessedImage = (image: HTMLImageElement, zoom: number): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      const size = 512;
      canvas.width = size;
      canvas.height = size;

      const minDim = Math.min(image.naturalWidth, image.naturalHeight);
      const cropSize = minDim / zoom;

      const sx = (image.naturalWidth - cropSize) / 2;
      const sy = (image.naturalHeight - cropSize) / 2;

      ctx.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, size, size);

      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.9,
      );
    });
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile || !previewImgRef.current) return;

    try {
      const processedBlob = await getProcessedImage(previewImgRef.current, zoom);
      if (!processedBlob) throw new Error("Failed to process image");

      const base64Image = await blobToBase64(processedBlob);

      await api.put("/profile/update-avatar", {
        image: base64Image,
      });

      showToast("success", "Avatar Updated", "Your profile picture has been updated.");
      setUpdate(!update);
      handleCancelUpload();
    } catch (error) {
      console.error("Failed to update avatar", error);
      showToast("error", "Update Failed", "Could not update avatar. Please try again.");
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteAvatar = () => {
    setIsAvatarMenuOpen(false);
    api
      .delete("/profile/delete-avatar")
      .then(() => {
        setUpdate(!update);
        showToast("success", "Avatar Deleted", "Your avatar has been deleted");
      })
      .catch((error) => {
        showToast("error", "Delete Failed", "Failed to delete avatar");
        console.error("Failed to delete avatar", error);
      });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden p-2 lg:p-4 gap-4 relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <AdminSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-72 bg-none transition-transform duration-300 transform",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <AdminSidebar />
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="pb-2 lg:pb-4">
          <AdminHeader
            userName={user.name}
            userEmail={user.email}
            userAvatar={user.avatar}
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />
        </div>

        {/* Content */}
        <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-4 py-6 lg:px-6 lg:py-8 scrollbar-hide">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row gap-6">
                <div className="relative group mx-auto md:mx-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 flex-shrink-0">
                    <Image
                      src={user.avatar || "https://github.com/shadcn.png"}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                    className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity rounded-full ${isAvatarMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <Camera className="text-white w-6 h-6" />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  {isAvatarMenuOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20 overflow-hidden">
                      <button
                        onClick={() => handleUpdateAvatar()}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => handleDeleteAvatar()}
                        className="w-full px-4 py-2 text-left text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-5 justify-between w-full min-h-[7rem]">
                  <div className="text-center md:text-left">
                    <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                    <p className="text-gray-500 mb-2">{user.email}</p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-gradient-to-r from-red-500/10 to-orange-500/10 text-red-600 rounded-full">
                      <Shield size={10} />
                      Administrator
                    </span>
                  </div>

                  <div className="w-full flex flex-col sm:flex-row gap-3 pr-6 items-center justify-center md:justify-end mt-6 md:mt-0">
                    <Button
                      variant="secondary"
                      className="h-9 px-4 text-xs font-medium border-none"
                      onClick={() => setShowDevices(!showDevices)}
                    >
                      <Monitor size={14} className="mr-1" />
                      Manage Devices
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="h-9 px-4 text-xs font-medium border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        >
                          <Lock size={14} className="mr-1" />
                          Change Password
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Change Password</AlertDialogTitle>
                          <AlertDialogDescription>
                            This feature will be available soon. Please check back later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Close</AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>

              {/* Notifications Card */}
              <div className="bg-white rounded-2xl p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Bell size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Notifications</h3>
                    <p className="text-sm text-gray-500">Manage your alert preferences</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Email Notifications</p>
                      <p className="text-xs text-gray-500">Receive emails for updates</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, emailNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">New User Alerts</p>
                      <p className="text-xs text-gray-500">When new users sign up</p>
                    </div>
                    <Switch
                      checked={notifications.newUserAlerts}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, newUserAlerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Security Alerts</p>
                      <p className="text-xs text-gray-500">Login and security events</p>
                    </div>
                    <Switch
                      checked={notifications.securityAlerts}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, securityAlerts: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Weekly Reports</p>
                      <p className="text-xs text-gray-500">Analytics summary emails</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, weeklyReports: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Admin Info Card */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Admin Role</h3>
                  <p className="text-lg font-medium text-gray-900">Full Access Administrator</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <Shield size={24} className="text-white" />
                </div>
              </div>

              {/* Quick Actions Card */}
              <div className="bg-white rounded-2xl p-6 lg:p-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Account Actions</h3>

                <div className="space-y-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                            <LogOut size={18} className="text-gray-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900 text-sm">
                              Logout from all devices
                            </p>
                            <p className="text-xs text-gray-500">End all active sessions</p>
                          </div>
                        </div>
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Logout from all devices?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will log you out from all devices where you{"'"}re currently signed
                          in. You will need to log in again on each device.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleLogout}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Logout All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Security Info */}
              <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-6 lg:p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Shield size={24} />
                  <h3 className="text-lg font-bold">Admin Security</h3>
                </div>
                <p className="text-sm opacity-90 mb-6">
                  Your admin account has full access to all platform features. Keep your credentials
                  secure and enable two-factor authentication for added protection.
                </p>
                <Button
                  variant="outline"
                  className="w-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white rounded-full h-11"
                >
                  Enable 2FA
                </Button>
              </div>
            </div>
          </div>

          {/* Device List Section */}
          {showDevices && (
            <div className="mt-6">
              <DeviceList />
            </div>
          )}
        </main>
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Preview Avatar</h3>

            <div className="w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-gray-100 mb-6 relative">
              <Image
                ref={previewImgRef}
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover transition-transform duration-100"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>

            <div className="mb-6 px-2">
              <label className="text-xs text-gray-500 font-medium mb-2 block">Zoom</label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-full border-gray-200"
                onClick={handleCancelUpload}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
                onClick={handleConfirmUpload}
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
