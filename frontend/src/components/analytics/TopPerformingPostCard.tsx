"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import PlatformIcon from "@/components/ui/PlatformIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { analyticsService } from "@/services/analytics.service";
import { Loader2, BarChart2 } from "lucide-react";

interface TopPerformingPostCardProps {
  initialData?: any;
}

export default function TopPerformingPostCard({ initialData }: TopPerformingPostCardProps) {
  const [platform, setPlatform] = useState<string>("all");
  const [metric] = useState<string>("totalEngagement");
  const [post, setPost] = useState<any>(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTopPost = async () => {
      try {
        setLoading(true);
        const data = await analyticsService.getTopPosts(
          1,
          metric,
          platform === "all" ? undefined : platform,
        );
        setPost(data[0] || null);
      } catch (error) {
        console.error("Failed to fetch top post", error);
        setPost(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTopPost();
  }, [platform, metric]);

  const metricValue = post ? post.derived?.totalEngagement || 0 : 0;

  // Helper to get display content
  const getDisplayContent = () => {
    if (!post || !post.postDetails) return { text: "No content", media: null };

    const platformContent = post.postDetails.platformSpecificContent?.[post.platform];
    const genericContent = post.postDetails.content;

    // Use platform specific if available, otherwise generic
    const text = platformContent?.text || genericContent?.text || "";
    const media = platformContent?.mediaItems?.[0] || genericContent?.mediaItems?.[0];

    return { text, media };
  };

  const { text: postText, media: postMedia } = getDisplayContent();

  return (
    <div className="bg-[#E9FBF3] rounded-[2rem] p-6 shadow-sm flex flex-col h-full gap-4">
      <div className="flex justify-between items-start pt-2">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.291 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-[#111827]">Best Content</h3>
            <div className="text-[10px] font-bold text-primary uppercase tracking-wider">
              Viral Index
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[80px] h-10 rounded-xl bg-white/80 border-none text-[10px] font-bold ring-0 focus:ring-0">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="mastodon">Mastodon</SelectItem>
              <SelectItem value="bluesky">Bluesky</SelectItem>
              <SelectItem value="tumblr">Tumblr</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="threads">Threads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 relative rounded-[2.2rem] overflow-hidden bg-white group shadow-inner">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : post ? (
          <>
            {postMedia?.s3Url ? (
              <Image
                src={postMedia.s3Url}
                alt="Post media"
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-white flex items-center justify-center p-8 text-slate-400 text-center text-sm font-medium italic leading-relaxed">
                "{postText}"
              </div>
            )}

            {/* Premium Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                    <PlatformIcon platform={post.platform} size={16} className="text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                    {post.platform}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl text-slate-900 shadow-xl">
                  <BarChart2 size={14} className="text-primary" />
                  <span className="font-black text-xs">
                    {post.platform === "facebook" && metricValue === 0 ? "N/A" : metricValue}
                  </span>
                </div>
              </div>

              {/* Caption Preview if Image exists */}
              {postMedia?.s3Url && postText && (
                <div className="mt-4 text-white/90 text-[11px] line-clamp-2 font-medium leading-relaxed drop-shadow-lg">
                  {postText}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2">
            <BarChart2 size={40} className="opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">No Posts Yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
