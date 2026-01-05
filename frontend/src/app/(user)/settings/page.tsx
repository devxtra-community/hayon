"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/axios";
import { Sidebar, Header } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const { showToast } = useToast();
  const [update, setUpdate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const platforms = [
    { name: "Threads", status: "disconnected", color: "bg-black" },
    { name: "Bluesky", status: "disconnected", color: "bg-blue-500" },
    { name: "Reddit", status: "disconnected", color: "bg-orange-500" },
    { name: "Instagram", status: "connected", color: "bg-pink-600" },
    { name: "Facebook", status: "connected", color: "bg-blue-600" },
  ];

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

      // Output size (square)
      const size = 512;
      canvas.width = size;
      canvas.height = size;

      // Calculate source crop
      // We want to take a square from the center of the original image
      // The size of that square depends on the zoom level.
      // Zoom 1 = min(W, H). Zoom 2 = min(W, H) / 2.
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
    api
      .delete("/profile/delete-avatar")
      .then(() => {
        setUpdate(!update);
        showToast("success", "Avatar Updated", "Your avatar has been deleted");
      })
      .catch((error) => {
        showToast("error", "Avatar Updated", "Failed to delete avatar");
        console.error("Failed to delete avatar", error);
      });
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden p-4 gap-4">
      {/* Sidebar Area */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="pb-4">
          <Header userName={user.name} userEmail={user.email} userAvatar={user.avatar} />
        </div>

        {/* Settings Content */}
        <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-6 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 flex flex-col md:flex-row gap-6">
                <div className="relative group mx-auto md:mx-0">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 flex-shrink-0">
                    <img
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

                <div className="flex-1 flex flex-col justify-between w-full min-h-[6rem]">
                  <div className="text-center md:text-left">
                    <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                    <p className="text-gray-500 mb-2">{user.email}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-center justify-center md:justify-end mt-4 md:mt-0">
                    <Button
                      variant="outline"
                      className="h-9 px-4 text-xs font-medium border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>

              {/* Plan Info Section */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 h-3/4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Plan Info</h3>
                  <span className="text-xs text-gray-400 font-medium">Free tier</span>
                </div>

                {/* Usage Bars */}
                <div className="space-y-8 mb-8">
                  {/* Total Generations */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Total Generations Left
                    </h4>
                    <div className="relative h-12 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #e5e7eb 10px, #e5e7eb 20px)`,
                        }}
                      />
                      <div
                        className="absolute left-0 top-0 h-full bg-[#318D62] rounded-full flex items-center justify-center text-white font-medium text-sm z-10"
                        style={{ width: "50%" }}
                      >
                        5/10
                      </div>
                    </div>
                  </div>

                  {/* Total Posts */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Total Posts Left</h4>
                    <div className="relative h-12 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #e5e7eb 10px, #e5e7eb 20px)`,
                        }}
                      />
                      <div
                        className="absolute left-0 top-0 h-full bg-[#318D62] rounded-full flex items-center justify-center text-white font-medium text-sm z-10"
                        style={{ width: "15%" }}
                      >
                        2/15
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-500 mb-6">
                  <div className="flex justify-between w-full sm:w-auto sm:block mb-1 sm:mb-0">
                    <span>Started Date</span>
                    <span className="ml-0 sm:ml-8 font-medium text-gray-900">11/12/2026</span>
                  </div>
                  <div className="flex justify-between w-full sm:w-auto sm:block">
                    <span>Expiring Date</span>
                    <span className="ml-0 sm:ml-8 font-medium text-gray-900">11/01/2027</span>
                  </div>
                </div>

                {/* Upgrade Box */}
                <div className="bg-[#318D62] rounded-xl p-6 text-center text-white">
                  <p className="text-sm opacity-90 mb-4">
                    Enjoy more access than limited and best experience
                  </p>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white rounded-full h-11"
                  >
                    Upgrade Plan
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Time Zone */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Time Zone</h3>
                  <p className="text-lg font-medium text-gray-900">india , mumbai UTC</p>
                </div>
                <Button className="bg-[#318D62] hover:bg-[#287350] text-white rounded-full px-6">
                  Change
                </Button>
              </div>

              {/* Connect Platforms */}
              <div className="bg-white rounded-2xl p-6 lg:p-8 h-3/4">
                <h3 className="text-lg font-bold text-gray-900 mb-8">Connect to platforms</h3>

                <div className="space-y-6">
                  {platforms.map((platform) => (
                    <div key={platform.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full ${platform.color} flex items-center justify-center text-white shadow-sm`}
                        >
                          {/* Icon placeholder - simple letter for now */}
                          <span className="font-bold text-sm">{platform.name[0]}</span>
                        </div>
                        <span className="text-base font-medium text-gray-900">{platform.name}</span>
                      </div>

                      <Button
                        variant="outline"
                        className={`rounded-full px-6 h-9 text-xs font-medium border-gray-200 ${
                          platform.status === "connected"
                            ? "bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                            : "bg-[#318D62] text-white hover:bg-[#287350] border-transparent"
                        }`}
                      >
                        {platform.status === "connected" ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Image Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Preview Avatar</h3>

            <div className="w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-gray-100 mb-6 relative">
              <img
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#318D62]"
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
                className="flex-1 rounded-full bg-[#318D62] hover:bg-[#287350] text-white"
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
