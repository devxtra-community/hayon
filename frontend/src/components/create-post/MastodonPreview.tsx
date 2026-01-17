import React from "react";
import Image from "next/image";
import { Globe, Reply, Repeat, Star, Bookmark, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types/create-post";
import { ReadMoreText } from "./ReadMoreText";

interface MastodonPreviewProps {
  user: User | null;
  postText: string;
  filePreviews: string[];
}

export const MastodonPreview: React.FC<MastodonPreviewProps> = ({
  user,
  postText,
  filePreviews,
}) => {
  return (
    <div className="bg-white text-[#1f232b] rounded border border-gray-200 p-4 max-w-xl mx-auto w-full font-sans shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md relative overflow-hidden bg-gray-100 flex-shrink-0">
            {user?.avatar ? (
              <Image src={user.avatar} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-[#6364ff] flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[15px] leading-tight text-gray-900">
              {user?.name || "Mastodon User"}
            </span>
            <span className="text-[15px] text-gray-500 leading-tight">mastodon</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-[14px]">
          <Globe size={14} />
          <span>1s</span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-3">
        {postText && (
          <div className="text-[15px] leading-normal text-gray-900 mb-3">
            <ReadMoreText text={postText} />
          </div>
        )}
        {filePreviews.length > 0 && (
          <div
            className={cn(
              "relative w-full rounded-lg overflow-hidden border border-gray-100 bg-gray-50 grid gap-[1px]",
              filePreviews.length === 1 ? "grid-cols-1" : "grid-cols-2",
            )}
          >
            {filePreviews.slice(0, 4).map((src, idx) => (
              <div key={idx} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Post ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px]">
                  ALT
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between text-gray-500 px-1">
        <Reply size={20} className="cursor-pointer hover:text-blue-500 transition-colors" />
        <Repeat size={20} className="cursor-pointer hover:text-green-500 transition-colors" />
        <Star size={20} className="cursor-pointer hover:text-yellow-500 transition-colors" />
        <Bookmark size={20} className="cursor-pointer hover:text-blue-500 transition-colors" />
        <MoreHorizontal
          size={20}
          className="cursor-pointer hover:text-gray-700 transition-colors"
        />
      </div>
    </div>
  );
};
