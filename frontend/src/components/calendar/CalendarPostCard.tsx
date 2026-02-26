"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

interface CalendarPostCardProps {
  id: string;
  imageUrl?: string;
  description: string;
  platformStatuses?: { platform: string; status: string }[];
  status: string;
  onClick?: () => void;
}

export function CalendarPostCard({
  imageUrl,
  description,
  platformStatuses = [],
  onClick,
}: CalendarPostCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[32px] p-4 flex gap-4 cursor-pointer hover:shadow-md transition-all border border-gray-50 mb-4"
    >
      {/* Post Image */}
      <div className="relative w-36 h-36 rounded-[24px] overflow-hidden flex-shrink-0 bg-gray-100">
        {imageUrl ? (
          <Image src={imageUrl} alt="Post Content" fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}
      </div>

      {/* Post Details */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div className="space-y-2">
          <p className="text-[#1A1A1A] text-[15px] leading-[1.4] font-medium line-clamp-3">
            {description}
          </p>
        </div>

        <div className="flex items-end justify-between mt-auto">
          <div className="space-y-2">
            <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider">
              posted
            </span>
            <div className="flex -space-x-2">
              {platformStatuses.map((p, idx) => (
                <div
                  key={idx}
                  className="relative w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white shadow-sm"
                  title={p.platform}
                >
                  <Image
                    src={`/images/platform-logos/${p.platform.toLowerCase()}.png`}
                    alt={p.platform}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          <button className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center text-gray-900 bg-white hover:bg-gray-50 transition-colors shadow-sm">
            <ArrowUpRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
