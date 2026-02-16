"use client";

import { Search, Menu, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { cn } from "@/lib/utils";

interface HeaderProps {
  userName: string;
  userEmail: string;
  userAvatar: string;
  onMenuClick?: () => void;
  filterContent?: React.ReactNode;
  onSearchChange?: (query: string) => void;
  className?: string;
}

export default function Header({
  userName,
  userEmail,
  userAvatar,
  onMenuClick,
  filterContent,
  onSearchChange,
  className,
}: HeaderProps) {
  const pathname = usePathname();

  // Keep existing logic for fallback or just rely on filterContent for History
  const showDefaultFilter =
    !filterContent && ["/drafts", "/calendar"].some((path) => pathname?.includes(path));

  const getPlaceholder = () => {
    if (pathname?.includes("/history")) return "Search History";
    if (pathname?.includes("/drafts")) return "Search Drafts";
    if (pathname?.includes("/calendar")) return "Search Calendar";
    return "Search";
  };

  return (
    <header
      className={cn(
        "flex items-center justify-between w-full px-6 py-3 bg-[#F7F7F7] rounded-[1rem] h-[13vh]",
        className,
      )}
    >
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
          placeholder={getPlaceholder()}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-12 pr-4 py-3 w-full bg-white border-none rounded-full text-base placeholder:text-gray-400 focus-visible:ring-0 shadow-none"
          style={{ height: "44px" }}
        />
      </div>

      {filterContent}

      {showDefaultFilter && (
        <button className="ml-4 w-[44px] h-[44px] bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Filter size={20} className="text-black" />
        </button>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Notification Bell */}
        <NotificationDropdown />

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-200">
            <Image
              src={userAvatar || "/default-avatar.png"}
              alt={userName}
              fill
              className="object-cover"
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
