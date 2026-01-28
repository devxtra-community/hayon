import React from "react";
import Image from "next/image";
import { Globe, MoreHorizontal, ThumbsUp, MessageCircle, Share } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types/create-post";
import { ReadMoreText } from "./ReadMoreText";

interface FacebookPreviewProps {
  user: User | null;
  postText: string;
  filePreviews: string[];
}

export const FacebookPreview: React.FC<FacebookPreviewProps> = ({
  user,
  postText,
  filePreviews,
}) => {
  return (
    <div className="bg-white text-[#050505] rounded-xl shadow-sm border border-gray-200 max-w-xl mx-auto w-full font-sans overflow-hidden">
      {/* Header */}
      <div className="p-3 flex items-start justify-between">
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-full relative overflow-hidden bg-gray-100 border border-gray-100">
            {user?.avatar ? (
              <Image src={user.avatar} alt={user.name || "User"} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-semibold text-[15px] leading-5 text-[#050505]">
              {user?.name || "Facebook User"}
            </span>
            <div className="flex items-center text-gray-500 text-[13px] leading-4 gap-1">
              <span>Just now</span>
              <span>·</span>
              <Globe size={12} />
            </div>
          </div>
        </div>
        <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors text-gray-600">
          <MoreHorizontal size={20} />
        </div>
      </div>

      {/* Content */}
      <div>
        {postText && (
          <div className="px-3 pb-3 text-[15px] leading-normal text-[#050505]">
            <ReadMoreText text={postText} />
          </div>
        )}
        {filePreviews.length > 0 && (
          <div
            className={cn(
              "w-full border-t border-b border-gray-100 bg-gray-50 grid",
              filePreviews.length === 1
                ? "grid-cols-1"
                : filePreviews.length === 2
                  ? "grid-cols-2 gap-[2px]"
                  : filePreviews.length === 3
                    ? "grid-cols-2 gap-[2px]"
                    : "grid-cols-2 gap-[2px]",
            )}
          >
            {filePreviews.slice(0, 4).map((src, idx) => (
              <div
                key={idx}
                className={cn(
                  "relative bg-gray-100 overflow-hidden",
                  filePreviews.length === 3 && idx === 0 ? "row-span-2 h-[400px]" : "h-[200px]",
                  filePreviews.length === 1 ? "h-auto max-h-[600px]" : "",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Post ${idx + 1}`}
                  className="w-full h-full object-cover mx-auto"
                />
                {idx === 3 && filePreviews.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
                    +{filePreviews.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2">
        <div className="flex justify-between text-[13px] text-gray-500 mb-2">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <ThumbsUp size={10} className="text-white fill-white" />
            </div>
            <span>1.2K</span>
          </div>
          <div className="flex gap-3">
            <span>45 comments</span>
            <span>12 shares</span>
          </div>
        </div>
        <div className="border-t border-gray-200 flex items-center justify-between py-1">
          <button className="flex-1 flex items-center justify-center gap-2 h-9 rounded-md hover:bg-gray-100 text-gray-600 font-medium text-[15px] transition-colors">
            <ThumbsUp size={18} />
            <span>Like</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 h-9 rounded-md hover:bg-gray-100 text-gray-600 font-medium text-[15px] transition-colors">
            <MessageCircle size={18} />
            <span>Comment</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 h-9 rounded-md hover:bg-gray-100 text-gray-600 font-medium text-[15px] transition-colors">
            <Share size={18} />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
