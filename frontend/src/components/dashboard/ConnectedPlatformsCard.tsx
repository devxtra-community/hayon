"use client";

import { ArrowUpRight } from "lucide-react";

export default function ConnectedPlatformsCard() {
  const platforms = [
    { name: "Threads", status: "disconnected", color: "bg-black" },
    { name: "Bluesky", status: "connected", color: "bg-blue-500" },
    { name: "Reddit", status: "connected", color: "bg-orange-500" },
    { name: "Instagram", status: "connected", color: "bg-pink-600" },
    { name: "Facebook", status: "disconnected", color: "bg-blue-600" },
  ];

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-medium text-gray-900">Connected Platforms</h3>
        <button className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
          <ArrowUpRight size={16} className="text-gray-500" />
        </button>
      </div>
      <div className="space-y-4">
        {platforms.map((platform) => (
          <div key={platform.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full ${platform.color} flex items-center justify-center text-white text-xs shadow-sm`}
              >
                {platform.name[0]}
              </div>
              <span className="text-sm font-medium text-gray-700">{platform.name}</span>
            </div>
            <span
              className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                platform.status === "connected"
                  ? "bg-[#d1fae5] text-[#065f46]"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {platform.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
