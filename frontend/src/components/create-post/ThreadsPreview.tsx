import React from "react";
import Image from "next/image";
import { MoreHorizontal, Heart, MessageCircle, Repeat, Send } from "lucide-react";
import { User } from "@/types/create-post";
import { ReadMoreText } from "./ReadMoreText";

interface ThreadsPreviewProps {
  user: User | null;
  postText: string;
  filePreviews: string[];
}

export const ThreadsPreview: React.FC<ThreadsPreviewProps> = ({ user, postText, filePreviews }) => {
  return (
    <div className="bg-white text-black rounded-xl border border-gray-200 p-4 max-w-xl mx-auto w-full font-sans shadow-sm flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full relative overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
            {user?.avatar ? (
              <Image src={user.avatar} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center text-white font-bold text-xs">
                @
              </div>
            )}
          </div>
          <span className="font-semibold text-[15px] text-black leading-tight">
            {user?.name || "threads_user"}
          </span>
        </div>
        <MoreHorizontal size={18} className="text-black" />
      </div>

      {/* Content */}
      {postText && (
        <div className="text-[15px] text-black leading-snug">
          <ReadMoreText text={postText} />
        </div>
      )}

      {/* Image / Media - Threads Horizontal Scroll */}
      {filePreviews.length > 0 && (
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 pb-2">
          {filePreviews.map((src, idx) => (
            <div
              key={idx}
              className="relative flex-shrink-0 w-10/12 aspect-[4/5] rounded-xl overflow-hidden border border-gray-100 snap-center bg-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Post ${idx + 1}`} className="w-full h-full object-cover" />
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px]">
                Alt
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-4 mt-1 text-black">
        <div className="flex items-center gap-1.5 cursor-pointer group">
          <Heart size={20} className="stroke-[2px] group-hover:text-red-500 transition-colors" />
          <span className="text-[13px] text-gray-500">1.2K</span>
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer group">
          <MessageCircle
            size={20}
            className="stroke-[2px] -scale-x-100 group-hover:text-gray-900 transition-colors"
          />
          <span className="text-[13px] text-gray-500">45</span>
        </div>
        <div className="flex items-center gap-1.5 cursor-pointer group">
          <Repeat size={20} className="stroke-[2px] group-hover:text-gray-900 transition-colors" />
          <span className="text-[13px] text-gray-500">12</span>
        </div>
        <Send
          size={20}
          className="stroke-[2px] cursor-pointer hover:text-gray-900 transition-colors"
        />
      </div>
    </div>
  );
};
