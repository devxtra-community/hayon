"use client";

import { Heart, MessageCircle, Share2, Instagram } from "lucide-react";

export default function BestPostCard() {
  return (
    <div className="relative bg-white rounded-2xl overflow-hidden group h-full min-h-[300px]">
      {/* Background Image Placeholder - using a gradient/solid color to behave like an image for now */}
      <div className="absolute inset-0 bg-gray-200">
        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 opacity-80" />
      </div>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <span className="bg-[#318D62] text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            Best post
          </span>
          <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-full">
            <Instagram size={18} className="text-white" />
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold text-3xl leading-tight mb-4 drop-shadow-md">
            better chapters need better <br />
            <span className="text-red-400">habits.</span>
          </h4>

          <div className="flex items-center gap-4 text-white/90 text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <Heart size={16} className="fill-white/20" /> 2.3k
            </div>
            <div className="flex items-center gap-1.5">
              <Share2 size={16} /> 5.6k
            </div>
            <div className="flex items-center gap-1.5">
              <MessageCircle size={16} /> 0.5k
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
