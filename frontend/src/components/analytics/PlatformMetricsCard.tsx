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
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col h-full gap-8">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400 font-bold tracking-widest text-[10px] uppercase">
            <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            </div>
            Global Reach
          </div>
          <h3 className="text-3xl font-black text-slate-800">Analytics</h3>
        </div>
        <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
          <SelectTrigger className="w-[140px] h-11 rounded-xl bg-slate-50 border-none text-xs font-bold ring-0 focus:ring-0">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-100">
            <SelectItem value="all">All Platforms</SelectItem>
            {Object.keys(followerCounts).map((platform) => (
              <SelectItem key={platform} value={platform} className="capitalize">
                {platform}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-6 flex-1">
        <div className="bg-slate-50/50 p-6 rounded-[1.5rem] flex flex-col gap-3 group hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-50">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Users size={20} />
            </div>
            <div className="text-slate-300">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Followers
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {metrics.followers.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-slate-50/50 p-6 rounded-[1.5rem] flex flex-col gap-3 group hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-50">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <BarChart3 size={20} />
            </div>
            <div className="text-slate-300">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Activity
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {metrics.posts.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-slate-50/50 p-6 rounded-[1.5rem] flex flex-col gap-3 group hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-50">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
              <MessageSquare size={20} />
            </div>
            <div className="text-slate-300">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Interactions
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {metrics.engagement.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bg-slate-50/50 p-6 rounded-[1.5rem] flex flex-col gap-3 group hover:bg-white hover:shadow-lg transition-all duration-300 border border-transparent hover:border-slate-50">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Layers size={20} />
            </div>
            <div className="text-slate-300">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M7 17L17 7M17 7H7M17 7V17" />
              </svg>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Reach Rate
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {metrics.engagementRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
