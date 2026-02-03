import React from "react";
import Image from "next/image";
import { MoreHorizontal, ImageIcon, Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types/create-post";
import { ReadMoreText } from "./ReadMoreText";
import { PreviewImage } from "./PreviewImage";

interface InstagramPreviewProps {
  user: User | null;
  postText: string;
  filePreviews: string[];
}

export const InstagramPreview: React.FC<InstagramPreviewProps> = ({
  user,
  postText,
  filePreviews,
}) => {
  return (
    <div className="bg-white text-black rounded-sm border border-gray-200 max-w-xl mx-auto w-full font-sans overflow-hidden">
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
            <div className="w-full h-full rounded-full border-2 border-white bg-white relative overflow-hidden">
              {user?.avatar ? (
                <Image src={user.avatar} alt="Avatar" fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200" />
              )}
            </div>
          </div>
          <span className="font-semibold text-sm">{user?.name || "instagram_user"}</span>
        </div>
        <MoreHorizontal size={20} className="text-gray-600" />
      </div>

      {/* Image Content - Instagram Carousel */}
      <div className="relative w-full bg-gray-50 border-t border-b border-gray-100">
        {filePreviews.length > 0 ? (
          <div className="relative group">
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide aspect-square">
              {filePreviews.map((src, idx) => (
                <div key={idx} className="flex-shrink-0 w-full h-full snap-center relative">
                  <PreviewImage src={src} alt={`Post ${idx + 1}`} fill />
                </div>
              ))}
            </div>

            {/* Dots Indicator */}
            {filePreviews.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-2 py-1.5 bg-black/10 backdrop-blur-sm rounded-full">
                {filePreviews.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      idx === 0 ? "bg-blue-500 scale-110" : "bg-white/60",
                    )}
                  />
                ))}
              </div>
            )}

            {/* Carousel Numbering (Instagram Style) */}
            {filePreviews.length > 1 && (
              <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                1/{filePreviews.length}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full aspect-square flex items-center justify-center text-gray-300">
            <ImageIcon size={48} />
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="px-3 pt-3 pb-2 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Heart size={24} className="cursor-pointer hover:text-gray-600 transition-colors" />
          <MessageCircle
            size={24}
            className="cursor-pointer hover:text-gray-600 transition-colors -rotate-90"
          />
          <Send size={24} className="cursor-pointer hover:text-gray-600 transition-colors" />
        </div>
        <Bookmark size={24} className="cursor-pointer hover:text-gray-600 transition-colors" />
      </div>

      {/* Caption Area */}
      <div className="px-3 pb-3">
        <div className="font-semibold text-sm mb-1">1,234 likes</div>
        {postText && (
          <div className="text-sm">
            <span className="font-semibold mr-2">{user?.name || "instagram_user"}</span>
            <ReadMoreText text={postText} />
          </div>
        )}
        <div className="text-[10px] text-gray-400 font-medium mt-2 uppercase tracking-wide">
          Just now
        </div>
      </div>
    </div>
  );
};
