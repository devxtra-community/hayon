import React from "react";
import Image from "next/image";
import { Heart, MessageCircle, Share } from "lucide-react";
import { cn } from "@/lib/utils";
import { User, Platform } from "@/types/create-post";
import { PreviewImage } from "./PreviewImage";

interface GenericPreviewProps {
  platform: Platform;
  user: User | null;
  postText: string;
  filePreviews: string[];
}

export const GenericPreview: React.FC<GenericPreviewProps> = ({
  platform,
  user,
  postText,
  filePreviews,
}) => {
  return (
    <div className="bg-white text-gray-900 border border-gray-200 rounded-xl shadow-sm max-w-xl mx-auto w-full flex flex-col">
      <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50 rounded-t-xl">
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm scale-90",
            platform.color,
          )}
        >
          {platform.icon}
        </div>
        <span className="font-semibold text-sm text-gray-700">{platform.name} Preview</span>
      </div>
      <div className="p-4">
        <div className="flex gap-3 mb-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden relative">
            {user?.avatar && <Image src={user.avatar} alt="User" fill className="object-cover" />}
          </div>
          <div>
            <div className="font-semibold text-sm">{user?.name}</div>
            <div className="text-xs text-gray-500">Just now</div>
          </div>
        </div>
        <div className="space-y-3">
          {postText && <p className="text-sm whitespace-pre-wrap">{postText}</p>}
          {filePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {filePreviews.map((src, idx) => (
                <div
                  key={idx}
                  className="relative rounded-lg overflow-hidden border border-gray-100 bg-gray-50 aspect-square"
                >
                  <PreviewImage src={src} alt={`Post ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex gap-6 text-gray-400">
          <Heart size={20} />
          <MessageCircle size={20} />
          <Share size={20} />
        </div>
      </div>
    </div>
  );
};
