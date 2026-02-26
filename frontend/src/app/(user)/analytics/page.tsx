"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/shared";
import {
  PlatformMetricsCard,
  FollowersPieChart,
  TopPerformingPostCard,
  GrowthChart,
  AnalyticsEngagementChart,
  AnalyticsInsightsCard,
} from "@/components/analytics";
import { analyticsService } from "@/services/analytics.service";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { LoadingH } from "@/components/ui/loading-h";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export default function AnalyticsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [growthPeriod, setGrowthPeriod] = useState<string>("7d");
  const [engagementPeriod, setEngagementPeriod] = useState<string>("7d");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user and analytics data
        const [userDataResults, results] = await Promise.all([
          api.get("/auth/me"),
          Promise.allSettled([
            analyticsService.getOverview("30d"),
            analyticsService.getTimeline("30d"),
            analyticsService.getHeatmap(),
            analyticsService.getTopPosts(5, "totalEngagement"),
            analyticsService.getGrowth("30d"),
          ]),
        ]);

        setUser(userDataResults.data.data.user);

        const overview = results[0].status === "fulfilled" ? results[0].value : null;
        const timeline = results[1].status === "fulfilled" ? results[1].value : [];
        const heatmap = results[2].status === "fulfilled" ? results[2].value : [];
        const topPosts = results[3].status === "fulfilled" ? results[3].value : [];
        const growth = results[4].status === "fulfilled" ? results[4].value : [];

        // Check if we got at least overview data
        if (!overview) {
          setError("Failed to load analytics data. Please try again later.");
          setData(null);
        } else {
          setData({ overview, timeline, heatmap, topPosts, growth });
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
        setError("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      <div className="flex-1 flex flex-col h-full bg-[#F7F7F7] rounded-none lg:rounded-[2.5rem] overflow-hidden">
        {user && (
          <div className="sticky top-0 z-40 px-4 pt-6 pb-2 lg:px-8 lg:pt-8 bg-[#F7F7F7]">
            <Header
              userName={user.name}
              userEmail={user.email}
              userAvatar={user.avatar}
              onMenuClick={() => setIsMobileMenuOpen(true)}
              title={
                <>
                  <span className="hidden lg:inline">
                    Your Performance <span className="text-primary italic">Snapshot</span>
                  </span>
                  <span className="lg:hidden">Analytics</span>
                </>
              }
              subtitle="Track and optimize your cross-platform strategy"
            />
          </div>
        )}

        <main className="flex-1 px-4 py-4 lg:px-8 lg:py-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 lg:gap-8">
          {loading || !user ? (
            <div className="flex items-center justify-center h-full">
              <LoadingH />
            </div>
          ) : error || !data ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <AlertCircle className="text-red-400" size={48} />
              <p className="text-gray-600">{error || "No data available"}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-primary underline"
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="max-w-[1600px] mx-auto w-full space-y-6 lg:space-y-10 pb-10">
              {/* Main Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
                {/* Analytics Card */}
                <div className="xl:col-span-1 h-[480px] sm:h-[520px] xl:h-auto hover:scale-[1.02] transition-transform duration-500">
                  <PlatformMetricsCard
                    platformStats={data.overview?.platformPerformance || []}
                    followerCounts={data.overview?.followers?.breakdown || {}}
                  />
                </div>

                {/* Follower Breakdown Chart */}
                <div className="xl:col-span-1 h-[550px] sm:h-[600px] xl:h-auto hover:scale-[1.02] transition-transform duration-500">
                  <FollowersPieChart data={data.overview?.followers?.breakdown || {}} />
                </div>

                {/* Best Content Card */}
                <div className="xl:col-span-1 h-[450px] sm:h-[500px] xl:h-auto hover:scale-[1.02] transition-transform duration-500">
                  <TopPerformingPostCard initialData={data.topPosts?.[0]} />
                </div>
              </div>

              {/* Growth & Engagement Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
                <div
                  className={cn(
                    "h-[350px] sm:h-[400px] lg:h-[450px] transition-all duration-700 ease-in-out",
                    growthPeriod === "30d" && "lg:col-span-2 lg:h-[600px]",
                  )}
                >
                  <GrowthChart
                    period={growthPeriod}
                    setPeriod={setGrowthPeriod}
                    initialData={growthPeriod === "30d" ? data.growth : undefined}
                  />
                </div>
                <div
                  className={cn(
                    "h-[350px] sm:h-[400px] lg:h-[450px] transition-all duration-700 ease-in-out",
                    engagementPeriod === "30d" && "lg:col-span-2 lg:h-[600px]",
                  )}
                >
                  <AnalyticsEngagementChart
                    period={engagementPeriod}
                    setPeriod={setEngagementPeriod}
                    initialData={engagementPeriod === "30d" ? data.timeline : undefined}
                  />
                </div>
              </div>

              {/* Bottom Row - Unified Insights Card */}
              <div className="pb-6">
                <AnalyticsInsightsCard heatmapData={data.heatmap || []} />
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
