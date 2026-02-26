"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Pencil, Check, X, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { api, clearAccessToken } from "@/lib/axios";
import { useToast } from "@/context/ToastContext";
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

interface ProfileCardProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  onUpdate: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, onUpdate }) => {
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const router = useRouter();

  const previewImgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { showToast } = useToast();

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

  const handleConfirmUpload = async () => {
    if (!selectedFile || !previewImgRef.current) return;

    try {
      // STEP 1: Process image (zoom, crop)
      const processedBlob = await getProcessedImage(previewImgRef.current, zoom);
      if (!processedBlob) throw new Error("Failed to process image");

      // Get the content type from the processed blob
      const contentType = processedBlob.type || "image/png";

      // STEP 2: Request presigned upload URL from backend
      const { data } = await api.post("/profile/upload-url", {
        contentType,
      });
      const { uploadUrl, s3Url, contentType: responseContentType } = data.data;

      // STEP 3: Upload blob directly to S3 using presigned URL
      await axios.put(uploadUrl, processedBlob, {
        headers: {
          "Content-Type": responseContentType,
        },
      });

      // STEP 4: Notify backend that upload succeeded
      await api.put("/profile/update-avatar", {
        imageUrl: s3Url,
      });

      // STEP 5: Update UI and show success toast
      showToast("success", "Avatar Updated", "Your profile picture has been updated.");
      onUpdate();
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
        onUpdate();
        showToast("success", "Avatar Updated", "Your avatar has been deleted");
      })
      .catch((error) => {
        showToast("error", "Avatar Updated", "Failed to delete avatar");
        console.error("Failed to delete avatar", error);
      });
  };

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

  const handleNameUpdate = async () => {
    if (!editedName.trim() || editedName === user?.name) {
      setIsEditingName(false);
      return;
    }
    setIsUpdatingName(true);
    try {
      await api.patch("/profile/change-name", {
        name: editedName.trim(),
      });
      showToast("success", "Name Updated", "Your name has been updated successfully.");
      onUpdate();
      setIsEditingName(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Failed to update name", error);
        showToast(
          "error",
          "Update Failed",
          error.message || "Could not update name. Please try again.",
        );
      }
    } finally {
      setIsUpdatingName(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-5 sm:p-6 lg:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 shadow-sm">
            <Image
              width={96}
              height={96}
              src={user.avatar}
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

        <div className="flex-1 flex flex-col gap-4 justify-between w-full">
          <div className="text-center md:text-left group flex flex-col">
            {isEditingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-[#318D62]/20 w-full max-w-[200px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleNameUpdate();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  autoFocus
                  disabled={isUpdatingName}
                />
                <button
                  onClick={handleNameUpdate}
                  disabled={isUpdatingName}
                  className="p-1 hover:bg-green-50 rounded text-green-600 transition-colors"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  disabled={isUpdatingName}
                  className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center md:justify-start gap-2 group">
                <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                <button
                  onClick={() => {
                    setEditedName(user.name);
                    setIsEditingName(true);
                  }}
                  className="p-1.5 opacity-0 sm:opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-[#318D62] focus:opacity-100"
                  title="Change name"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
            <p className="text-gray-500 mb-2">{user.email}</p>
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-3 md:pr-6 items-center justify-center md:justify-end mt-4 md:mt-0">
            <Link href="/dashboard/devices" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                className="h-10 sm:h-9 w-full sm:px-4 text-[11px] sm:text-xs font-medium border-none border-gray-100"
              >
                Manage Devices
              </Button>
            </Link>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 sm:h-9 w-full sm:px-4 text-[11px] sm:text-xs font-medium border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut size={14} className="mr-2" />
                  Logout
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Logout Confirmation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to logout? You will need to log in again to access your
                    dashboard.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Logout
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
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
                width={100}
                height={100}
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
    </>
  );
};
