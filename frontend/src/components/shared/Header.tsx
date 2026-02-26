"use client";

import { Search, Menu, Filter, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { cn } from "@/lib/utils";

interface HeaderProps {
  userName: string;
  userEmail: string;
  userAvatar: string;
  onMenuClick?: () => void;
  filterContent?: React.ReactNode;
  leftContent?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  onSearchChange?: (query: string) => void;
  className?: string;
}

export default function Header({
  userName,
  userEmail,
  userAvatar,
  onMenuClick,
  filterContent,
  leftContent,
  title,
  subtitle,
  showBackButton,
  onBack,
  onSearchChange,
  className,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const showDefaultFilter =
    !filterContent && ["/drafts", "/calendar"].some((path) => pathname?.includes(path));

  const getPlaceholder = () => {
    if (pathname?.includes("/history")) return "Search History";
    if (pathname?.includes("/drafts")) return "Search Drafts";
    if (pathname?.includes("/calendar")) return "Search Calendar";
    return "Search";
  };

  return (
    <div className={cn("w-full mb-6 lg:mb-8", className)}>
      {/* Mobile Header - Pill Style */}
      <header className="flex lg:hidden items-center justify-between w-full h-[64px] bg-white rounded-full px-3 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100/50">
        <div className="flex items-center gap-1">
          <button
            onClick={onMenuClick}
            className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all duration-200"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
          {showBackButton && (
            <button
              onClick={onBack || (() => router.back())}
              className="p-2 text-gray-400 hover:text-primary transition-all"
            >
              <ArrowLeft size={20} strokeWidth={2} />
            </button>
          )}
        </div>

        {(title || leftContent) && (
          <div className="flex-1 text-center px-2 truncate">
            {title ? (
              <span className="text-sm font-bold text-gray-900">{title}</span>
            ) : (
              <div className="scale-75 origin-center">{leftContent}</div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pr-1">
          <NotificationDropdown />
          <div className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100">
            <Image
              src={userAvatar || "/default-avatar.png"}
              alt={userName}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </header>

      {/* Desktop Header Layout */}
      <header className="hidden lg:flex items-center justify-between w-full h-[13vh] bg-[#F7F7F7] rounded-[1rem] px-8 py-4">
        {/* Left Content, Title or Search Bar */}
        <div className="flex-1">
          {leftContent ? (
            <div className="flex items-center gap-4">
              {showBackButton && (
                <button
                  onClick={onBack || (() => router.back())}
                  className="p-2 text-gray-400 hover:text-primary transition-all bg-white rounded-full shadow-sm border border-gray-100"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              {leftContent}
            </div>
          ) : title ? (
            <div className="flex items-center gap-4">
              {showBackButton && (
                <button
                  onClick={onBack || (() => router.back())}
                  className="p-2 text-gray-400 hover:text-primary transition-all bg-white rounded-full shadow-sm border border-gray-100"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div className="space-y-0.5">
                <h1 className="text-xl lg:text-3xl font-bold text-gray-900 tracking-tight">
                  {title}
                </h1>
                {subtitle && <p className="text-gray-500 text-xs lg:text-sm">{subtitle}</p>}
              </div>
            </div>
          ) : (
            <div className="relative max-w-sm">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <Input
                type="text"
                placeholder={getPlaceholder()}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-12 pr-4 py-3 w-full bg-white border-none rounded-full text-sm placeholder:text-gray-400 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-none transition-all outline-none"
                style={{ height: "44px" }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {filterContent}

          {showDefaultFilter && (
            <button className="w-[44px] h-[44px] bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm border border-gray-100/50 group">
              <Filter
                size={18}
                className="text-gray-600 group-hover:text-primary transition-colors"
              />
            </button>
          )}

          {/* Vertical Divider */}
          <div className="h-8 w-[1px] bg-gray-200 mx-2" />

          {/* Right Section */}
          <div className="flex items-center gap-6">
            <NotificationDropdown />

            {/* User Profile */}
            <div className="flex items-center gap-4 py-1.5 pl-3 pr-1.5 rounded-full bg-white/50 border border-gray-100 backdrop-blur-sm">
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 leading-none mb-1">{userName}</p>
                <p className="text-[10px] text-gray-500 font-medium tracking-tight uppercase">
                  {userEmail}
                </p>
              </div>
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-gray-100">
                <Image
                  src={userAvatar || "/default-avatar.png"}
                  alt={userName}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
