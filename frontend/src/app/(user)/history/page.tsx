"use client";

import { useState, useMemo, useEffect } from "react";
import { Sidebar, Header } from "@/components/shared";
import { HistoryCard, PlatformPostStatus } from "@/components/history/HistoryCard";
import { HistoryFilters, FilterState } from "@/components/history/HistoryFilters";
import { PostReportModal } from "@/components/history/PostReportModal";
import PostDetailModal from "@/components/history/PostDetailModal";
import { cn } from "@/lib/utils";
import { api } from "@/lib/axios";
import { LoadingH } from "@/components/ui/loading-h";

interface Post {
  _id: string;
  content: {
    text: string;
    mediaItems: Array<{ s3Url: string }>;
  };
  platformSpecificContent?: {
    [key: string]: {
      text?: string;
      mediaItems?: Array<{ s3Url: string }>;
    };
  };
  status: string;
  platformStatuses: PlatformPostStatus[];
  scheduledAt: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState({ name: "", email: "", avatar: "" });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    statuses: [],
    platforms: [],
    dateRange: "all",
  });
  const [sort, setSort] = useState<string>("newest");

  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch user
      const userRes = await api.get("/auth/me");
      setUser({
        name: userRes.data.data.user.name || "User",
        email: userRes.data.data.user.email || "",
        avatar: userRes.data.data.user.avatar || "/mock-avatar.png",
      });

      // TODO::  have to do pagination if we fetch like this
      // Fetch history
      const postsRes = await api.get("/posts", {
        params: {
          limit: 100,
        },
      });

      // Filter history (include attempted and active posts)
      const allowedStatuses = ["COMPLETED", "PARTIAL_SUCCESS", "FAILED", "PENDING", "PROCESSING"];
      const allPosts = postsRes.data.data.posts || [];
      setPosts(allPosts.filter((p: Post) => allowedStatuses.includes(p.status)));
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = async (postId: string) => {
    try {
      await api.post(`/posts/${postId}/retry`);
      alert("Retry initiated for failed platforms");
      setIsReportOpen(false);
      fetchData(); // Refresh
    } catch (error) {
      console.error("Failed to retry post", error);
      alert("Failed to initiate retry.");
    }
  };

  const handleActionClick = (id: string, action: string) => {
    const post = posts.find((p) => p._id === id);
    if (!post) return;

    switch (action) {
      case "view":
        setSelectedPost(post);
        setIsReportOpen(true);
        break;
      case "detail":
        setSelectedPost(post);
        setIsDetailOpen(true);
        break;
      case "retry":
        handleRetry(id);
        break;
    }
  };

  // Filter Logic
  const filteredItems = useMemo(() => {
    return posts
      .filter((item) => {
        // Search Filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesContent = item.content.text.toLowerCase().includes(query);
          if (!matchesContent) return false;
        }

        // Status Filter
        if (filters.statuses.length > 0) {
          const isProcessingIncluded = filters.statuses.includes("PROCESSING");
          const matchesDirectly = filters.statuses.includes(item.status);
          const matchesProcessingAlias =
            isProcessingIncluded && (item.status === "PENDING" || item.status === "PROCESSING");

          if (!matchesDirectly && !matchesProcessingAlias) {
            return false;
          }
        }
        // Platform Filter (check if any platform in the post matches the filter)
        if (filters.platforms.length > 0) {
          const postPlatforms = item.platformStatuses.map((ps) => ps.platform.toLowerCase());
          const match = filters.platforms.some((fp) => postPlatforms.includes(fp.toLowerCase()));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduledAt || a.createdAt).getTime();
        const dateB = new Date(b.scheduledAt || b.createdAt).getTime();

        switch (sort) {
          case "oldest":
            return dateA - dateB;
          case "scheduled_asc":
            return dateA - dateB;
          case "scheduled_desc":
            return dateB - dateA;
          case "newest":
          default:
            return dateB - dateA;
        }
      });
  }, [posts, filters, sort, searchQuery]);

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-72 bg-none transition-transform duration-300 transform",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Sidebar />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-[#F7F7F7] lg:rounded-[2.5rem] overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:block px-8 pt-8 bg-[#F7F7F7]">
          <Header
            userName={user.name}
            userEmail={user.email}
            userAvatar={user.avatar}
            onMenuClick={() => setIsMobileMenuOpen(true)}
            title="History"
            subtitle="Review your past social performance"
            filterContent={
              <HistoryFilters
                filters={filters}
                setFilters={setFilters}
                sort={sort}
                setSort={setSort}
              />
            }
          />
        </div>

        {/* Mobile Header & Search */}
        <div className="lg:hidden bg-white px-4 pt-4 pb-4 space-y-4">
          <Header
            userName={user.name}
            userEmail={user.email}
            userAvatar={user.avatar}
            onMenuClick={() => setIsMobileMenuOpen(true)}
            title="History"
          />
          <div className="flex items-center gap-3 pb-1">
            <div className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f1f1f1] border-none rounded-full py-2.5 pl-11 pr-4 text-[14px] focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-gray-400 font-medium"
              />
            </div>
            <HistoryFilters
              filters={filters}
              setFilters={setFilters}
              sort={sort}
              setSort={setSort}
              isMobile={true}
            />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 px-4 py-4 lg:px-8 lg:py-8 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingH />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-lg text-gray-500 font-medium">No history items found.</p>
              <button
                onClick={() => {
                  setFilters({ statuses: [], platforms: [], dateRange: "all" });
                  setSearchQuery("");
                }}
                className="mt-2 text-primary hover:underline font-semibold"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
              {filteredItems.map((item) => (
                <HistoryCard
                  key={item._id}
                  id={item._id}
                  imageUrl={item.content.mediaItems[0]?.s3Url || "/placeholder.png"}
                  description={item.content.text}
                  status={item.status as any}
                  platformStatuses={item.platformStatuses}
                  mediaCount={
                    (item.content.mediaItems?.length || 0) +
                    Object.values(item.platformSpecificContent || {}).reduce(
                      (acc: number, curr: any) => acc + (curr.mediaItems?.length || 0),
                      0,
                    )
                  }
                  createdAt={item.createdAt}
                  onActionClick={handleActionClick}
                />
              ))}
            </div>
          )}
        </main>

        <PostReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          post={selectedPost}
          onRetry={handleRetry}
        />

        <PostDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          post={selectedPost}
        />
      </div>
    </>
  );
}
