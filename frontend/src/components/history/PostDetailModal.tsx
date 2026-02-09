"use client";

import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlatformPostStatus } from "@/components/history/HistoryCard";
import Image from "next/image";
import { Heart, MessageCircle, Share2, BarChart, Eye, Clock, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";

interface Post {
  _id: string;
  content: {
    text: string;
    mediaItems: Array<{ s3Url: string }>;
  };
  platformStatuses: PlatformPostStatus[];
  platformSpecificContent?: {
    [key: string]: {
      text?: string;
      mediaItems?: Array<{ s3Url: string }>;
    };
  };
  createdAt: string;
  scheduledAt: string;
}

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
}

// Temporary interface for analytics data until backend is connected
interface PlatformAnalytics {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  saved?: number;
  clicks?: number;
}

// Platform configuration for metrics labels and visibility
const PLATFORM_CONFIG: Record<
  string,
  {
    labels: Record<string, string>;
    show: string[];
    icons: Record<string, any>;
  }
> = {
  facebook: {
    labels: {
      likes: "Reactions",
      comments: "Comments",
      shares: "Shares",
      reach: "Reach",
      impressions: "Impressions",
    },
    show: ["impressions", "reach", "likes", "comments", "shares"],
    icons: {
      likes: Heart,
      comments: MessageCircle,
      shares: Share2,
      reach: BarChart,
      impressions: Eye,
    },
  },
  instagram: {
    labels: {
      likes: "Likes",
      comments: "Comments",
      shares: "Shares",
      saved: "Saved",
      reach: "Reach",
      impressions: "Impressions",
    },
    show: ["impressions", "reach", "likes", "comments", "shares", "saved"],
    icons: {
      likes: Heart,
      comments: MessageCircle,
      shares: Share2,
      saved: BarChart,
      reach: BarChart,
      impressions: Eye,
    },
  },
  threads: {
    labels: {
      likes: "Likes",
      comments: "Replies",
      shares: "Reposts",
      views: "Views",
      impressions: "Impressions",
    },
    show: ["impressions", "likes", "comments", "shares"],
    icons: { likes: Heart, comments: MessageCircle, shares: Share2, impressions: Eye },
  },
  linkedin: {
    labels: {
      likes: "Reactions",
      comments: "Comments",
      shares: "Reposts",
      impressions: "Impressions",
    },
    show: ["impressions", "likes", "comments", "shares"],
    icons: { likes: Heart, comments: MessageCircle, shares: Share2, impressions: Eye },
  },
  twitter: {
    labels: {
      likes: "Likes",
      comments: "Replies",
      shares: "Reposts",
      saved: "Bookmarks",
      impressions: "Views",
    },
    show: ["impressions", "likes", "comments", "shares", "saved"],
    icons: {
      likes: Heart,
      comments: MessageCircle,
      shares: Share2,
      saved: BarChart,
      impressions: Eye,
    },
  },
  tumblr: {
    labels: { likes: "Notes", comments: "Replies", shares: "Reblogs" },
    show: ["likes", "shares", "comments"],
    icons: { likes: Heart, comments: MessageCircle, shares: Share2 },
  },
  bluesky: {
    labels: { likes: "Likes", comments: "Replies", shares: "Reposts" },
    show: ["likes", "comments", "shares"],
    icons: { likes: Heart, comments: MessageCircle, shares: Share2 },
  },
  mastodon: {
    labels: { likes: "Favorites", comments: "Replies", shares: "Boosts" },
    show: ["likes", "comments", "shares"],
    icons: { likes: Heart, comments: MessageCircle, shares: Share2 },
  },
};

const PostDetailModal = ({ isOpen, onClose, post }: PostDetailModalProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [isDataDelayed, setIsDataDelayed] = useState(false);
  const [fetchedPost, setFetchedPost] = useState<Post | null>(null);
  const [fetchedAnalytics, setFetchedAnalytics] = useState<Record<string, PlatformAnalytics>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (!post?._id || !selectedPlatform || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const response = await api.post(
        `/analytics/posts/${post._id}/refresh?platform=${selectedPlatform}`,
      );
      if (response.data?.data?.analytics) {
        setFetchedAnalytics(response.data.data.analytics);
      }
    } catch (error) {
      console.error("Failed to refresh analytics:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch latest post data and analytics on open
  useEffect(() => {
    const fetchPostDetails = async () => {
      if (isOpen && post?._id) {
        setIsLoading(true);
        try {
          const response = await api.get(`/posts/${post._id}`);
          if (response.data?.data) {
            setFetchedPost(response.data.data.post);
            setFetchedAnalytics(response.data.data.analytics || {});
          }
        } catch (error) {
          console.error("Failed to fetch post details:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchPostDetails();
  }, [isOpen, post?._id]);

  // Use fetched post if available, otherwise fall back to prop
  const activePost = fetchedPost || post;

  // Filter only completed platforms
  const availablePlatforms = useMemo(() => {
    if (!activePost) return [];
    return activePost.platformStatuses.filter(
      (p) => p.status === "completed" || p.status === "processing",
    );
  }, [activePost]);

  // Set default platform on open or when data loads
  useEffect(() => {
    if (isOpen && availablePlatforms.length > 0 && !selectedPlatform) {
      setSelectedPlatform(availablePlatforms[0].platform);
    }
  }, [isOpen, availablePlatforms, selectedPlatform]);

  // Check for 2-hour delay logic
  useEffect(() => {
    if (!activePost || !selectedPlatform) return;

    const currentPlatformStatus = activePost.platformStatuses.find(
      (p) => p.platform === selectedPlatform,
    );

    const checkTime =
      currentPlatformStatus?.completedAt || activePost.scheduledAt || activePost.createdAt;

    if (checkTime) {
      const postTime = new Date(checkTime).getTime();
      const now = new Date().getTime();
      const diffInHours = (now - postTime) / (1000 * 60 * 60);
      setIsDataDelayed(diffInHours < 2);
    }
  }, [activePost, selectedPlatform]);

  // Get content for selected platform
  const currentContent = useMemo(() => {
    if (!activePost || !selectedPlatform) return null;

    // Check specific content first
    const specific = activePost.platformSpecificContent?.[selectedPlatform];
    if (specific) {
      return {
        text: specific.text || activePost.content.text,
        media: specific.mediaItems || activePost.content.mediaItems,
      };
    }
    // Fallback to global content
    return {
      text: activePost.content.text,
      media: activePost.content.mediaItems,
    };
  }, [activePost, selectedPlatform]);

  // Get current metrics
  const analytics: PlatformAnalytics = useMemo(() => {
    return (
      fetchedAnalytics[selectedPlatform] || {
        likes: 0,
        comments: 0,
        shares: 0,
        reach: 0,
        impressions: 0,
        saved: 0,
      }
    );
  }, [fetchedAnalytics, selectedPlatform]);

  // Get live post URL
  const livePostUrl = useMemo(() => {
    if (!activePost || !selectedPlatform) return null;
    const status = activePost.platformStatuses.find((p) => p.platform === selectedPlatform);
    return status?.platformPostUrl;
  }, [activePost, selectedPlatform]);

  if (!post) return null;

  const config = PLATFORM_CONFIG[selectedPlatform] || PLATFORM_CONFIG.facebook; // Fallback

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1250px] w-[95vw] p-0 gap-0 overflow-hidden bg-white border-0 rounded-[32px] md:h-[550px] flex flex-col md:flex-row">
        {/* Left Column - Content Preview */}
        <div className="w-full md:w-[70%] bg-[#0A0A0A] flex flex-col relative h-[350px] md:h-full">
          {/* Media Display */}
          <div className="flex-1 relative flex items-center justify-center bg-black/40 overflow-hidden">
            {currentContent?.media && currentContent.media.length > 0 ? (
              <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth">
                {currentContent.media.map((media, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex-shrink-0 relative snap-center flex items-center justify-center",
                      currentContent.media!.length > 1 ? "w-[90%] md:w-full mx-auto" : "w-full",
                    )}
                  >
                    <div className="relative w-full h-full p-4 md:p-8">
                      <Image
                        src={media.s3Url}
                        alt={`Media ${idx + 1}`}
                        fill
                        className="object-contain"
                        priority={idx === 0}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-white/20 flex flex-col items-center">
                <BarChart size={64} strokeWidth={1} />
                <span className="mt-4 text-sm font-light tracking-widest uppercase">
                  Text Only Post
                </span>
              </div>
            )}

            {/* Pagination indicator for many images */}
            {currentContent?.media && currentContent.media.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
                {currentContent.media.slice(0, 10).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40" />
                ))}
                {currentContent.media.length > 10 && (
                  <span className="text-[10px] text-white/60 font-medium">
                    +{currentContent.media.length - 10}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Caption Area */}
          <div className="hidden md:block p-8 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0 pointer-events-none">
            <p className="text-base leading-relaxed text-white drop-shadow-md font-medium line-clamp-3 pointer-events-auto">
              {currentContent?.text}
            </p>
          </div>
        </div>

        {/* Right Column - Analytics & Details */}
        <div className="flex-1 flex flex-col h-full bg-white relative w-full md:w-[30%] border-l border-gray-100">
          <div className="p-6 md:p-8 flex flex-col h-full overflow-y-auto">
            <DialogHeader className="mb-6 flex-row items-center justify-between space-y-0">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Post Performance
              </DialogTitle>
            </DialogHeader>

            {/* Platform Selector */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">
                  Platform
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer",
                      isRefreshing && "opacity-50 cursor-not-allowed",
                    )}
                    title="Refresh analytics"
                  >
                    <RefreshCw size={12} className={cn(isRefreshing && "animate-spin")} />
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </button>
                  {livePostUrl && (
                    <a
                      href={livePostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary/80 hover:text-primary transition-colors cursor-pointer group"
                    >
                      View on {selectedPlatform}
                      <Share2
                        size={12}
                        className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform"
                      />
                    </a>
                  )}
                </div>
              </div>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50 border-gray-100 focus:ring-primary/20">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  {availablePlatforms.length > 0 ? (
                    availablePlatforms.map((p) => (
                      <SelectItem key={p.platform} value={p.platform} className="capitalize">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 relative rounded-full overflow-hidden">
                            <Image
                              src={`/images/platform-logos/${p.platform.toLowerCase()}.png`}
                              alt={p.platform}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span>{p.platform}</span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      No platforms available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Warning Message for Recent Posts */}
            {isDataDelayed && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3 items-start">
                <div className="p-1.5 bg-amber-100 rounded-full text-amber-600 mt-0.5">
                  <Clock size={14} strokeWidth={3} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-800 mb-0.5">Data Processing</h4>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Analytics data typically takes about 2 hours to populate after posting. Please
                    check back later for accurate metrics.
                  </p>
                </div>
              </div>
            )}

            {/* Special Warning for Facebook Permission Issues */}
            {selectedPlatform === "facebook" &&
              analytics.likes === 0 &&
              analytics.comments === 0 &&
              analytics.shares === 0 && (
                <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100 flex gap-3 items-start">
                  <div className="p-1.5 bg-blue-100 rounded-full text-blue-600 mt-0.5">
                    <BarChart size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-800 mb-0.5">
                      Post Metrics Unavailable
                    </h4>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Post-level metrics (likes, comments, shares) for Facebook are temporarily
                      unavailable due to permission updates. Follower counts and total posts are
                      still being tracked.
                    </p>
                  </div>
                </div>
              )}

            {/* Metrics List (Vertical, Single Card) */}
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-[72px] w-full animate-pulse bg-gray-50 rounded-2xl border border-gray-100/50"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-0 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                  {config.show.map((metricKey, index) => {
                    const value = analytics[metricKey as keyof PlatformAnalytics] as
                      | number
                      | undefined;
                    if (value === undefined) return null;

                    const Icon = config.icons[metricKey] || BarChart;
                    const label = config.labels[metricKey] || metricKey;

                    const metricColors: Record<string, string> = {
                      likes: "rose",
                      comments: "orange",
                      shares: "green",
                      reach: "blue",
                      impressions: "indigo",
                      saved: "purple",
                      views: "indigo",
                      clicks: "blue",
                    };
                    const color = metricColors[metricKey] || "indigo";

                    return (
                      <MetricRow
                        key={metricKey}
                        icon={<Icon size={18} />}
                        label={label}
                        value={value}
                        color={color}
                        last={index === config.show.length - 1}
                      />
                    );
                  })}
                </div>

                {/* Empty State if no metrics shown */}
                {config.show.length === 0 && (
                  <div className="p-8 text-center text-gray-400 text-sm bg-gray-50 rounded-2xl">
                    No metrics available for this platform
                  </div>
                )}
              </>
            )}

            {/* Mobile Caption (Visible only on mobile) */}
            <div className="md:hidden mt-auto pt-6 border-t border-gray-100 px-2 pb-4">
              <p className="text-[15px] leading-relaxed text-gray-800 font-medium">
                {currentContent?.text}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper Component for Metrics Row
const MetricRow = ({
  icon,
  label,
  value,
  color,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  last?: boolean;
}) => {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    indigo: "text-indigo-600 bg-indigo-50",
    rose: "text-rose-600 bg-rose-50",
    orange: "text-orange-600 bg-orange-50",
    green: "text-green-600 bg-green-50",
    purple: "text-purple-600 bg-purple-50",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 hover:bg-gray-50 transition-colors",
        !last && "border-b border-gray-100",
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg", colorMap[color])}>{icon}</div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <span className="text-lg font-bold text-gray-900">{value.toLocaleString()}</span>
    </div>
  );
};

export default PostDetailModal;
