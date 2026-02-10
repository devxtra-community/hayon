"use client";

import { useState, useMemo } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, MessageSquare, BarChart3, Layers } from "lucide-react";

interface PlatformMetricsCardProps {
  platformStats: any[];
  followerCounts: Record<string, number>;
}

export default function PlatformMetricsCard({
  platformStats,
  followerCounts,
}: PlatformMetricsCardProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");

  const metrics = useMemo(() => {
    if (selectedPlatform === "all") {
      // Aggregate data for "All"
      const totalFollowers = Object.values(followerCounts).reduce((a, b) => a + b, 0);
      const totalPosts = platformStats.reduce((acc, curr) => acc + (curr.postCount || 0), 0);
      const totalEngagement = platformStats.reduce(
        (acc, curr) => acc + (curr.totalEngagement || 0),
        0,
      );

      // Weighted average for engagement rate
      const avgEngagementRate =
        platformStats.length > 0
          ? platformStats.reduce((acc, curr) => acc + (curr.avgEngagementRate || 0), 0) /
            platformStats.length
          : 0;

      return {
        followers: totalFollowers,
        posts: totalPosts,
        engagement: totalEngagement,
        engagementRate: avgEngagementRate,
      };
    } else {
      // Specific platform data
      const stats = platformStats.find((p) => p._id === selectedPlatform) || {};
      return {
        followers: followerCounts[selectedPlatform] || 0,
        posts: stats.postCount || 0,
        engagement: stats.totalEngagement || 0,
        engagementRate: stats.avgEngagementRate || 0,
      };
    }
  }, [selectedPlatform, platformStats, followerCounts]);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Platform Metrics</h3>
          <p className="text-sm text-slate-500">Key performance indicators</p>
        </div>
        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {Object.keys(followerCounts).map((platform) => (
              <SelectItem key={platform} value={platform} className="capitalize">
                {platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        <div className="bg-slate-50 p-4 rounded-xl flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-medium uppercase">
            <Users size={14} /> Followers
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {metrics.followers.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-medium uppercase">
            <BarChart3 size={14} /> Posts
          </div>
          <div className="text-2xl font-bold text-slate-800">{metrics.posts.toLocaleString()}</div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-medium uppercase">
            <MessageSquare size={14} /> Engagement
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {metrics.engagement.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs font-medium uppercase">
            <Layers size={14} /> Avg. ER
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {metrics.engagementRate.toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
