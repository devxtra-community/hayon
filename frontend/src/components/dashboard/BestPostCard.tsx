"use client";

import { Heart, MessageCircle, Share2 } from "lucide-react";
import Image from "next/image";

interface MediaItem {
  s3Key: string;
  s3Url: string;
  mimeType: string;
  originalFilename?: string;
}

interface BestPostCardProps {
  post?: {
    platform: string;
    metrics: {
      likes?: number;
      shares?: number;
      comments?: number;
      impressions?: number;
    };
    postDetails?: {
      content?: {
        text?: string;
        mediaItems?: MediaItem[];
      };
      platformSpecificContent?: Record<
        string,
        {
          text?: string;
          mediaItems?: MediaItem[];
        }
      >;
      platformStatuses?: Array<{
        platform: string;
        platformPostUrl?: string;
      }>;
    };
  };
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toString();
}

function getPlatformIcon(platform: string) {
  const p = platform.toLowerCase();
  const logoPath = `/images/platform-logos/${p}.png`;

  return (
    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/10 shadow-sm">
      <Image src={logoPath} alt={`${platform} logo`} fill className="object-cover" />
    </div>
  );
}

export default function BestPostCard({ post }: BestPostCardProps) {
  const hasData = post && post.metrics;
  const platform = post?.platform || "mastodon";

  // Helper to get display content
  const getDisplayContent = () => {
    if (!post || !post.postDetails)
      return { text: "Your best performing post will appear here.", media: null };

    const platformContent = post.postDetails.platformSpecificContent?.[platform];
    const genericContent = post.postDetails.content;

    // Use platform specific if available, otherwise generic
    const text =
      platformContent?.text ||
      genericContent?.text ||
      "Your best performing post will appear here.";
    const media = platformContent?.mediaItems?.[0] || genericContent?.mediaItems?.[0];

    return { text, media };
  };

  const { text: content, media } = getDisplayContent();

  const likes = hasData ? post.metrics.likes || 0 : 0;
  const shares = hasData ? post.metrics.shares || 0 : 0;
  const comments = hasData ? post.metrics.comments || 0 : 0;

  const imageUrl = media ? media.s3Url : null;

  return (
    <div className="relative bg-white rounded-2xl overflow-hidden group h-full min-h-[300px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
      {/* Background Image or Fallback Gradient */}
      <div className="absolute inset-0 bg-gray-200">
        {imageUrl ? (
          <Image src={imageUrl} alt="Top Post" fill className="object-cover" />
        ) : (
          <>
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-90" />
            {/* Abstract pattern overlay */}
            <div
              className="absolute inset-0 opacity-20 mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </>
        )}
      </div>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <span className="bg-white/20 backdrop-blur-md text-white border border-white/20 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2 w-fit">
              {hasData ? "Top Performer" : "No Data Yet"}
            </span>
          </div>
          <div className="text-white">{getPlatformIcon(platform)}</div>
        </div>

        <div>
          <h4 className="text-white font-bold text-xl lg:text-2xl leading-tight mb-4 drop-shadow-lg line-clamp-3">
            {content.length > 80 ? `"${content.slice(0, 80)}..."` : `"${content}"`}
          </h4>

          <div className="flex items-center gap-6 text-white font-medium">
            <div className="flex items-center gap-2">
              <Heart size={20} className="fill-white/20" />
              <span className="text-lg">{formatNumber(likes)}</span>
            </div>
            {shares > 0 && (
              <div className="flex items-center gap-2">
                <Share2 size={20} />
                <span className="text-lg">{formatNumber(shares)}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <span className="text-lg">{formatNumber(comments)}</span>
            </div>

            {/* Direct to Post Link */}
            {hasData &&
              post.postDetails?.platformStatuses?.find((ps: any) => ps.platform === platform)
                ?.platformPostUrl && (
                <a
                  href={
                    post.postDetails?.platformStatuses?.find((ps: any) => ps.platform === platform)
                      ?.platformPostUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto bg-white/20 hover:bg-white/30 backdrop-blur-md p-2 rounded-full transition-colors flex items-center justify-center h-10 w-10 shadow-lg"
                  title="View on platform"
                >
                  <Share2 size={18} className="text-white" />
                </a>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
