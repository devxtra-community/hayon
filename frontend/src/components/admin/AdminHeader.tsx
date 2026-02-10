"use client";

import { Search, Bell, Menu, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface AdminHeaderProps {
  userName: string;
  userEmail: string;
  userAvatar: string;
  onMenuClick?: () => void;
}

export default function AdminHeader({
  userName,
  userEmail,
  userAvatar,
  onMenuClick,
}: AdminHeaderProps) {
  return (
    <header className="flex items-center justify-between w-full px-6 py-3 bg-[#F7F7F7] rounded-[1rem] h-[13vh]">
      {/* Mobile Menu Button - Visible on small screens */}
      <button
        onClick={onMenuClick}
        className="lg:hidden mr-4 p-2 text-gray-600 hover:bg-gray-200 rounded-full"
      >
        <Menu size={24} />
      </button>

      {/* Search Bar */}
      <div className="relative flex-1 max-w-sm hidden md:block">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900" size={20} />
        <Input
          type="text"
          placeholder="Search users, plans..."
          className="pl-12 pr-4 py-3 w-full bg-white border-none rounded-full text-base placeholder:text-gray-400 focus-visible:ring-0 shadow-none"
          style={{ height: "44px" }}
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Admin Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-full border border-red-500/20">
          <Shield size={14} className="text-red-500" />
          <span className="text-xs font-semibold text-red-600">Admin</span>
        </div>

        {/* Notification Bell */}
        <button className="relative w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Bell size={20} className="text-black" strokeWidth={2} />
          {/* Notification dot */}
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-red-500/30 shadow-sm bg-gray-200">
            <Image
              width={40}
              height={40}
              src={userAvatar || "/default-avatar.png"}
              alt={userName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-sm font-bold text-gray-900 leading-none mb-1">{userName}</p>
            <p className="text-xs text-gray-500">{userEmail}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
