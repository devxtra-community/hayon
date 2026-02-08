"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { SiMastodon, SiBluesky, SiTumblr } from "react-icons/si";

interface ScheduledPost {
  _id: string;
  content: {
    text: string;
  };
  selectedPlatforms: string[];
  scheduledAt: string;
}

interface UpcomingPostsCarouselProps {
  posts?: ScheduledPost[];
}

function getPlatformIcon(platform: string) {
  switch (platform) {
    case "mastodon":
      return <SiMastodon size={16} />;
    case "bluesky":
      return <SiBluesky size={16} />;
    case "tumblr":
      return <SiTumblr size={16} />;
    default:
      return <SiMastodon size={16} />;
  }
}

function getPlatformColors(platform: string) {
  switch (platform) {
    case "mastodon":
      return "bg-purple-100 text-purple-500";
    case "bluesky":
      return "bg-blue-100 text-blue-500";
    case "tumblr":
      return "bg-slate-200 text-slate-600";
    default:
      return "bg-slate-100 text-slate-500";
  }
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

  if (date.toDateString() === now.toDateString()) {
    return `Today, ${timeStr}`;
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${timeStr}`;
  } else {
    const dayStr = date.toLocaleDateString("en-US", { weekday: "short" });
    return `${dayStr}, ${timeStr}`;
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
  const platform = currentPost.selectedPlatforms?.[0] || "mastodon";

  return (
    <div className="bg-white rounded-2xl p-6 h-full flex flex-col border border-slate-100 shadow-sm relative group">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-800">Upcoming Posts</h3>
        {displayPosts.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={prevSlide}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={nextSlide}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div className="bg-slate-50 rounded-xl p-4 flex-1 mb-4 relative overflow-hidden">
          {/* Platform Icon Badge */}
          <div className={`absolute top-4 right-4 p-2 rounded-full ${getPlatformColors(platform)}`}>
            {getPlatformIcon(platform)}
          </div>

          <p className="text-slate-700 font-medium line-clamp-4 leading-relaxed pr-8">
            {currentPost.content.text}
          </p>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
          <Clock size={16} className="text-[#318D62]" />
          <span>
            {currentPost._id === "placeholder" ? "—" : formatScheduledTime(currentPost.scheduledAt)}
          </span>
        </div>
      </div>

      {/* Pagination dots */}
      {displayPosts.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
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
