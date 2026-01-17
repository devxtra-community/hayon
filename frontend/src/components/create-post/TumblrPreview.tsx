import { MessageCircle, Repeat, Heart, MoreHorizontal, Share } from "lucide-react";
import Image from "next/image";
import { User } from "@/types/create-post";

interface TumblrPreviewProps {
  user: User | null;
  postText: string;
  filePreviews: string[];
}

export const TumblrPreview = ({ user, postText, filePreviews }: TumblrPreviewProps) => {
  return (
    <div className="bg-white text-black rounded-lg shadow-sm max-w-xl mx-auto w-full font-sans overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 relative overflow-hidden">
            {user?.avatar ? (
              <Image src={user.avatar} alt={user.name || "User"} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-black" />
            )}
          </div>
          <span className="font-bold text-[15px] text-black">{user?.name || "tumblr_user"}</span>
        </div>
        <MoreHorizontal size={20} className="text-gray-600" />
      </div>

      {/* Image Content - Tumblr Photoset (Vertical Stack) */}
      {filePreviews.length > 0 && (
        <div className="w-full flex flex-col gap-[2px] bg-gray-50 border-t border-b border-gray-100">
          {filePreviews.map((src, idx) => (
            <div key={idx} className="relative w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Post ${idx + 1}`}
                className="w-full h-auto object-contain mx-auto"
              />
            </div>
          ))}
        </div>
      )}

      {/* Text Content */}
      <div className="px-4 py-3">
        {postText && (
          <div className="text-[17px] leading-snug">
            {/* 
               Tumblr often has a title and body. 
               Since we only have postText, we'll render it as the body or title based on styling.
               The reference shows a title-like look. We'll just render it normally for now 
               but maybe handle hashtags specially if we want to mimic the reference exactly.
            */}
            <p className="whitespace-pre-wrap text-black font-serif italic mb-2">
              {/* Mimicking the reference style somewhat - specifically specific font or style */}
              {/* Actually reference uses a standard sans-serif for username but content looks like it could be anything.
                   Let's stick to standard san-serif for now, maybe specific sizing.
                */}
              <span className="font-normal not-italic font-sans text-[20px] mb-2 block">
                {postText.split("\n")[0]}{" "}
                {/* Treat first line as potentially title-ish if we wanted, but let's just dump text */}
              </span>
            </p>
            {/* Hashtags are often blue or grey in Tumblr. Reference shows greyish/black tags */}
            <div className="flex flex-wrap gap-2 text-gray-500 text-[15px]">
              {/* Synthetically generating tags for preview visual if text doesn't have them? 
                   Or just rely on user input. The reference has tags. 
               */}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-1 flex items-center justify-between text-gray-600">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <MessageCircle size={22} className="-scale-x-100" />{" "}
            {/* Message bubble often flipped */}
            <span className="text-[15px] font-medium">2</span>
          </div>
          <div className="flex items-center gap-2">
            <Repeat size={22} />
            <span className="text-[15px] font-medium">646</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart size={22} />
            <span className="text-[15px] font-medium">1.2K</span>
          </div>
        </div>
        <div className="p-1">
          <Share size={22} />
        </div>
      </div>
    </div>
  );
};
