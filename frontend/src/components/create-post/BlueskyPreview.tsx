import React from "react";
import Image from "next/image";
import { MessageSquare, Repeat, Heart, Bookmark, Share, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types/create-post";
import { ReadMoreText } from "./ReadMoreText";

interface BlueskyPreviewProps {
  user: User | null;
  postText: string;
  filePreviews: string[];
}

export const BlueskyPreview: React.FC<BlueskyPreviewProps> = ({ user, postText, filePreviews }) => {
  return (
    <div className="bg-white text-black p-4 rounded-xl border border-gray-200 font-sans shadow-sm max-w-xl mx-auto w-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gray-100 relative overflow-hidden">
            {user?.avatar ? (
              <Image src={user.avatar} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap leading-5">
            <span className="font-bold text-[15px] text-black shrink-0">
              {user?.name || "Bluesky User"}
            </span>
            <span className="text-gray-500 text-[15px] shrink-0 truncate max-w-[120px]">
              @{user?.email?.split("@")[0] || "handle.bsky.social"}
            </span>
            <span className="text-gray-500 text-[15px] shrink-0">· 4h</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-0.5 mb-2">
        {postText && (
          <div className="text-[15px] leading-normal text-black mb-2">
            {/* Simple hashtag highlighting logic for preview if expanded, otherwise simple read more */}
            <ReadMoreText text={postText} />
          </div>
        )}
        {filePreviews.length > 0 && (
          <div
            className={cn(
              "relative w-full rounded-xl overflow-hidden border border-gray-100 mt-2 bg-gray-50 grid gap-[1px]",
              filePreviews.length === 1 ? "grid-cols-1" : "grid-cols-2",
            )}
          >
            {filePreviews.slice(0, 4).map((src, idx) => (
              <div key={idx} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Post ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px]">
                  ALT
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pr-2 text-gray-500">
        <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-500">
          <MessageSquare size={18} />
          <span className="text-[13px] font-medium">93</span>
        </div>
        <div className="flex items-center gap-2 group cursor-pointer hover:text-green-500">
          <Repeat size={18} />
          <span className="text-[13px] font-medium">309</span>
        </div>
        <div className="flex items-center gap-2 group cursor-pointer hover:text-pink-500">
          <Heart size={18} />
          <span className="text-[13px] font-medium">3.9K</span>
        </div>
        <div className="flex items-center gap-4">
          <Bookmark size={19} className="cursor-pointer hover:text-blue-500" />
          <Share size={18} className="cursor-pointer hover:text-blue-500" />
          <MoreHorizontal size={18} className="cursor-pointer hover:text-gray-700" />
        </div>
      </div>
    </div>
  );
};
