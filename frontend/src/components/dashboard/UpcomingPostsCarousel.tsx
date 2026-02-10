"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface ScheduledPost {
  _id: string;
  content: {
    text: string;
    mediaItems?: Array<{
      s3Url: string;
      mimeType: string;
    }>;
  };
  selectedPlatforms: string[];
  scheduledAt: string;
}

interface UpcomingPostsCarouselProps {
  posts?: ScheduledPost[];
}

function getPlatformIcon(platform: string) {
  const logoPath = `/images/platform-logos/${platform}.png`;

  return (
    <img
      src={logoPath}
      alt={platform}
      className="w-5 h-5 object-contain"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

function formatScheduledTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const monthStr = date.toLocaleDateString("en-US", { month: "short" });
  const dayOfMonth = date.getDate();

  if (date.toDateString() === now.toDateString()) {
    return `Today, ${timeStr}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${timeStr}`;
  } else {
    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
    return `${dayOfWeek}, ${monthStr} ${dayOfMonth}, ${timeStr}`;
  }
}

export default function UpcomingPostsCarousel({ posts }: UpcomingPostsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayPosts = useMemo(() => {
    if (!posts || posts.length === 0) {
      return [
        {
          _id: "placeholder",
          content: { text: "No scheduled posts yet. Create your first one!" },
          selectedPlatforms: ["mastodon"],
          scheduledAt: new Date().toISOString(),
        },
      ];
    }
    return posts;
  }, [posts]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayPosts.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + displayPosts.length) % displayPosts.length);
  };

  const currentPost = displayPosts[currentIndex];
  const platforms = currentPost.selectedPlatforms || [];
  const media = currentPost.content.mediaItems?.[0];

  return (
    <div className="bg-white rounded-2xl p-6 h-full flex flex-col border border-slate-100 shadow-sm relative group overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800">Upcoming Posts</h3>
        {displayPosts.length > 1 && (
          <div className="flex gap-2 relative z-10">
            <button
              onClick={prevSlide}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors bg-white/50 backdrop-blur-sm shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextSlide}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors bg-white/50 backdrop-blur-sm shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="bg-slate-50 rounded-xl p-4 flex-1 mb-4 relative overflow-hidden flex flex-col">
          {/* Platforms List (Vertical) */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
            {platforms.map((p) => (
              <div
                key={p}
                className={`p-1 rounded-md border bg-white shadow-sm transition-transform hover:scale-110`}
                title={p}
              >
                {getPlatformIcon(p)}
              </div>
            ))}
          </div>

          {/* Media Preview */}
          {media?.s3Url && (
            <div className="w-full h-40 mb-3 rounded-lg overflow-hidden border border-slate-200 bg-slate-200">
              <img
                src={media.s3Url}
                alt="Post preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

          <p className="text-slate-700 font-medium text-sm line-clamp-2 leading-relaxed flex-1 pr-10">
            {currentPost.content.text}
          </p>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mt-auto px-1">
          <div className="h-6 w-6 rounded-full bg-green-50 flex items-center justify-center">
            <Clock size={14} className="text-[#318D62]" />
          </div>
          <span className="truncate">
            {currentPost._id === "placeholder" ? "—" : formatScheduledTime(currentPost.scheduledAt)}
          </span>
        </div>
      </div>

      {/* Pagination dots */}
      {displayPosts.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {displayPosts.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? "w-4 bg-[#318D62]" : "w-1.5 bg-slate-200"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
