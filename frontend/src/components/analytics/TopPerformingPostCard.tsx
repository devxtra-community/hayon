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
import { Loader2, Heart, MessageCircle, Share2, BarChart2 } from "lucide-react";

interface TopPerformingPostCardProps {
  initialData?: any;
}

export default function TopPerformingPostCard({ initialData }: TopPerformingPostCardProps) {
  const [platform, setPlatform] = useState<string>("all");
  const [metric, setMetric] = useState<string>("totalEngagement");
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

    // Skip initial fetch if we have initialData and params haven't changed (which they haven't on mount)
    // But honestly, simpler to just fetch or only fetch when params change.
    // Let's fetch when params change.
    fetchTopPost();
  }, [platform, metric]);

  const metricValue = post
    ? metric === "totalEngagement"
      ? post.derived?.totalEngagement
      : metric === "likes"
        ? post.metrics?.likes
        : metric === "comments"
          ? post.metrics?.comments
          : post.metrics?.shares
    : 0;

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
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-start mb-4 gap-2">
        <h3 className="text-lg font-bold text-slate-800 whitespace-nowrap">Best Post</h3>
        <div className="flex gap-2">
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="mastodon">Mastodon</SelectItem>
              <SelectItem value="bluesky">Bluesky</SelectItem>
              <SelectItem value="tumblr">Tumblr</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="threads">Threads</SelectItem>
            </SelectContent>
          </Select>

          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue placeholder="Metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalEngagement">Engagement</SelectItem>
              <SelectItem value="likes">Likes</SelectItem>
              <SelectItem value="comments">Comments</SelectItem>
              {/* Only show shares metric in dropdown if the selected platform supports it */}
              {!["tumblr", "instagram", "threads"].includes(platform) && (
                <SelectItem value="shares">Shares</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-50 border border-slate-100 group">
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
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-6 text-slate-400 text-center text-sm">
                {postText}
              </div>
            )}

            {/* Overlay Info */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <PlatformIcon platform={post.platform} size={24} className="text-white" />
                  <span className="text-sm font-medium capitalize">{post.platform}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-white">
                  {/* Direct to Post Link */}
                  {post.postDetails?.platformStatuses?.find(
                    (ps: any) => ps.platform === (platform === "all" ? post.platform : platform),
                  )?.platformPostUrl && (
                    <>
                      <a
                        href={
                          post.postDetails.platformStatuses.find(
                            (ps: any) =>
                              ps.platform === (platform === "all" ? post.platform : platform),
                          )?.platformPostUrl
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-white/80 transition-colors flex items-center"
                        title="View on platform"
                      >
                        <Share2 size={14} className="" />
                      </a>
                      <div className="w-[1px] h-3 bg-white/20 mx-1" />
                    </>
                  )}

                  {metric === "likes" && <Heart size={14} className="fill-white" />}
                  {metric === "comments" && <MessageCircle size={14} className="fill-white" />}
                  {metric === "shares" && <Share2 size={14} className="fill-white" />}
                  {metric === "totalEngagement" && <BarChart2 size={14} className="fill-white" />}
                  <span className="font-bold text-sm">
                    {post.platform === "facebook" && metricValue === 0 ? "N/A*" : metricValue}
                  </span>
                </div>
              </div>

              {/* Special Note for Facebook N/A */}
              {post.platform === "facebook" && metricValue === 0 && (
                <div className="absolute bottom-16 right-4 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white/80">
                  * Metrics unavailable
                </div>
              )}

              {/* Caption Preview if Image exists */}
              {postMedia?.s3Url && postText && (
                <div className="mt-2 text-white/90 text-xs line-clamp-2 font-medium drop-shadow-md">
                  {postText}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No posts found
          </div>
        )}
      </div>
    </div>
  );
}
