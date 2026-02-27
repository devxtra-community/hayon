"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  Share2,
  BarChart,
  Eye,
  Clock,
  RefreshCw,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlatformPostStatus } from "@/components/history/HistoryCard";
import { LoadingH } from "@/components/ui/loading-h";

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

interface PlatformAnalytics {
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  impressions: number;
  saved?: number;
  clicks?: number;
}

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
      reach: BarChart,
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

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [post, setPost] = useState<Post | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, PlatformAnalytics>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDataDelayed, setIsDataDelayed] = useState(false);

  const selectedPlatform = searchParams.get("platform") || "";

  const setSelectedPlatform = (platform: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("platform", platform);
    router.replace(`?${params.toString()}`);
  };

  useEffect(() => {
    const fetchFullData = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        // Fetch post
        const response = await api.get(`/posts/${id}`);
        if (response.data?.data) {
          setPost(response.data.data.post);
          setAnalytics(response.data.data.analytics || {});

          // Set default platform if none selected
          const available = response.data.data.post.platformStatuses.filter(
            (p: any) => p.status === "completed" || p.status === "processing",
          );
          if (available.length > 0 && !selectedPlatform) {
            setSelectedPlatform(available[0].platform);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFullData();
  }, [id, selectedPlatform]);

  useEffect(() => {
    if (!post || !selectedPlatform) return;

    const currentPlatformStatus = post.platformStatuses.find(
      (p) => p.platform === selectedPlatform,
    );

    const checkTime = currentPlatformStatus?.completedAt || post.scheduledAt || post.createdAt;

    if (checkTime) {
      const postTime = new Date(checkTime).getTime();
      const now = new Date().getTime();
      const diffInHours = (now - postTime) / (1000 * 60 * 60);
      setIsDataDelayed(diffInHours < 2);
    }
  }, [post, selectedPlatform]);

  const handleRefresh = async () => {
    if (!id || !selectedPlatform || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const response = await api.post(
        `/analytics/posts/${id}/refresh?platform=${selectedPlatform}`,
      );
      if (response.data?.data?.analytics) {
        setAnalytics(response.data.data.analytics);
      }
    } catch (error) {
      console.error("Failed to refresh analytics:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const availablePlatforms = useMemo(() => {
    if (!post) return [];
    return post.platformStatuses.filter(
      (p) => p.status === "completed" || p.status === "processing",
    );
  }, [post]);

  const currentContent = useMemo(() => {
    if (!post || !selectedPlatform) return null;

    const specific = post.platformSpecificContent?.[selectedPlatform];
    if (specific) {
      return {
        text: specific.text || post.content.text,
        media: specific.mediaItems || post.content.mediaItems,
      };
    }
    return {
      text: post.content.text,
      media: post.content.mediaItems,
    };
  }, [post, selectedPlatform]);

  const currentAnalytics: PlatformAnalytics = useMemo(() => {
    return (
      analytics[selectedPlatform] || {
        likes: 0,
        comments: 0,
        shares: 0,
        reach: 0,
        impressions: 0,
        saved: 0,
      }
    );
  }, [analytics, selectedPlatform]);

  const livePostUrl = useMemo(() => {
    if (!post || !selectedPlatform) return null;
    const status = post.platformStatuses.find((p) => p.platform === selectedPlatform);
    return status?.platformPostUrl;
  }, [post, selectedPlatform]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F7F7F7] lg:rounded-[2.5rem]">
        <LoadingH />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#F7F7F7] lg:rounded-[2.5rem] text-gray-400">
        <p className="text-lg font-medium">Post not found.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-primary hover:underline font-semibold flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Go back
        </button>
      </div>
    );
  }

  const config = PLATFORM_CONFIG[selectedPlatform] || PLATFORM_CONFIG.facebook;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F7F7F7] lg:rounded-[2.5rem] overflow-y-auto lg:overflow-hidden pt-6 lg:pt-10">
      <main className="flex-1 flex flex-col pt-0 lg:overflow-hidden">
        {/* Subheader area with Back Button and Titles */}
        <div className="px-6 py-2 lg:px-10 lg:py-4 flex items-center gap-4 mb-2 flex-shrink-0">
          <button
            onClick={() => router.back()}
            className="group flex items-center justify-center w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-full shadow-sm border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all outline-none"
          >
            <ChevronLeft
              size={24}
              className="text-gray-500 group-hover:text-primary transition-colors"
            />
          </button>
          <div className="space-y-0.5">
            <h1 className="text-xl lg:text-3xl font-extrabold text-gray-900 tracking-tight leading-none">
              Post Performance
            </h1>
            <p className="text-xs lg:text-sm font-semibold text-gray-400 uppercase tracking-widest">
              {selectedPlatform ? `${selectedPlatform} Analytics` : "Social Insights"}
            </p>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden px-4 lg:px-8 pb-4 gap-4 lg:gap-6">
          {/* Media Preview Card */}
          <div className="w-full lg:w-[60%] xl:w-[65%] flex flex-col bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-sm border border-gray-100/50 overflow-hidden min-h-[400px] lg:min-h-0 relative flex-shrink-0 lg:flex-shrink">
            <div className="flex-1 bg-black relative flex items-center justify-center overflow-hidden">
              {currentContent?.media && currentContent.media.length > 0 ? (
                <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth">
                  {currentContent.media.map((media, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 relative snap-center flex items-center justify-center w-full"
                    >
                      <div className="relative w-full h-full p-4 lg:p-8">
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
                <div className="text-white/10 flex flex-col items-center">
                  <BarChart size={100} strokeWidth={1} />
                  <span className="mt-4 text-sm font-bold tracking-widest uppercase opacity-40">
                    Text Only Content
                  </span>
                </div>
              )}

              {/* Media Pagination */}
              {currentContent?.media && currentContent.media.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/10">
                  {currentContent.media.map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  ))}
                </div>
              )}

              {/* Caption Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none">
                <p className="text-white text-sm lg:text-lg font-medium leading-relaxed line-clamp-3 lg:line-clamp-4 drop-shadow-sm pointer-events-auto">
                  {currentContent?.text}
                </p>
              </div>
            </div>
          </div>

          {/* Analytics Sidebar */}
          <div className="flex-1 flex flex-col bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-sm border border-gray-100/50 lg:overflow-y-auto custom-scrollbar">
            <div className="p-6 lg:p-8 flex flex-col gap-6">
              {/* Controls */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                    Platform Selection
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className={cn(
                        "flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-primary transition-colors cursor-pointer",
                        isRefreshing && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <RefreshCw size={12} className={cn(isRefreshing && "animate-spin")} />
                      {isRefreshing ? "Refreshing" : "Refresh"}
                    </button>
                    {livePostUrl && (
                      <a
                        href={livePostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:opacity-70 transition-opacity"
                      >
                        <span className="hidden sm:inline">View Post</span>
                        <Share2 size={12} />
                      </a>
                    )}
                  </div>
                </div>

                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="w-full h-12 rounded-[1.25rem] bg-gray-50 border-gray-100 focus:ring-primary/20 text-sm font-bold text-gray-700">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[1.25rem] border-gray-100 shadow-xl">
                    {availablePlatforms.map((p) => (
                      <SelectItem key={p.platform} value={p.platform} className="capitalize">
                        <div className="flex items-center gap-3 py-1">
                          <div className="w-6 h-6 relative rounded-full overflow-hidden shadow-sm ring-1 ring-gray-100">
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
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications / Alerts */}
              <div className="space-y-3">
                {isDataDelayed && (
                  <div className="p-4 rounded-[1.5rem] bg-amber-50/50 border border-amber-100 flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <Clock size={16} />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-amber-900 uppercase tracking-tight">
                        Processing Data
                      </h4>
                      <p className="text-[10px] text-amber-700 font-medium">
                        Metrics update every 2 hours after posting.
                      </p>
                    </div>
                  </div>
                )}

                {selectedPlatform === "facebook" &&
                  currentAnalytics.likes === 0 &&
                  currentAnalytics.comments === 0 &&
                  currentAnalytics.shares === 0 && (
                    <div className="p-4 rounded-[1.5rem] bg-blue-50/50 border border-blue-100 flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <BarChart size={16} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-blue-900 uppercase tracking-tight">
                          Limited Insights
                        </h4>
                        <p className="text-[10px] text-blue-700 font-medium">
                          Facebook metrics are restricted by current API permissions.
                        </p>
                      </div>
                    </div>
                  )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 gap-2.5">
                {config.show.map((metricKey) => {
                  const value = currentAnalytics[metricKey as keyof PlatformAnalytics] as
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
                    <MetricCard
                      key={metricKey}
                      icon={<Icon size={18} />}
                      label={label}
                      value={value}
                      color={color}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const MetricCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) => {
  const colorMap: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50/50 group-hover:bg-blue-100/50",
    indigo: "text-indigo-600 bg-indigo-50/50 group-hover:bg-indigo-100/50",
    rose: "text-rose-600 bg-rose-50/50 group-hover:bg-rose-100/50",
    orange: "text-orange-600 bg-orange-50/50 group-hover:bg-orange-100/50",
    green: "text-green-600 bg-green-50/50 group-hover:bg-green-100/50",
    purple: "text-purple-600 bg-purple-50/50 group-hover:bg-purple-100/50",
  };

  return (
    <div className="group flex items-center justify-between p-4 bg-gray-50/30 rounded-[1.5rem] border border-gray-100/30 hover:border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-300">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
            colorMap[color],
          )}
        >
          {icon}
        </div>
        <span className="text-sm font-bold text-gray-500 tracking-tight">{label}</span>
      </div>
      <span className="text-xl font-black text-gray-900 tracking-tighter">
        {value.toLocaleString()}
      </span>
    </div>
  );
};
