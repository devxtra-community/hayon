"use client";

import { useState, useMemo } from "react";
import { Sidebar, Header } from "@/components/dashboard";
import { HistoryCard } from "@/components/history/HistoryCard";
import { HistoryFilters, FilterState } from "@/components/history/HistoryFilters"; // Import filters
import { cn } from "@/lib/utils";

// Expanded Mock Data with Status and Date
const historyItems = [
  {
    id: 1,
    imageUrl: "https://images.unsplash.com/photo-1518005020951-ecc8e5cc6991",
    description: "A breathtaking aerial view of a bustling cyberpunk metropolis",
    status: "COMPLETED",
    platform: "Instagram",
    scheduledAt: "2024-03-10T10:00:00Z",
  },
  {
    id: 2,
    imageUrl: "https://images.unsplash.com/photo-1542385489-d10d9c792484",
    description: "Modern typography design with bold aesthetics",
    status: "SCHEDULED",
    platform: "LinkedIn",
    scheduledAt: "2024-03-15T09:00:00Z",
  },
  {
    id: 3,
    imageUrl: "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
    description: "Creative workspace setup with natural light",
    status: "DRAFT",
    platform: "Twitter",
    scheduledAt: "2024-03-20T14:30:00Z",
  },
  {
    id: 4,
    imageUrl: "https://images.unsplash.com/photo-1593642532400-91a02925d947",
    description: "Professional networking event coverage",
    status: "FAILED",
    platform: "Facebook",
    scheduledAt: "2024-03-05T11:00:00Z",
  },
  {
    id: 5,
    imageUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205",
    description: "Product photography session behind the scenes",
    status: "COMPLETED",
    platform: "Instagram",
    scheduledAt: "2024-03-01T16:20:00Z",
  },
  {
    id: 6,
    imageUrl: "https://images.unsplash.com/photo-1493612276216-9c5901955d43",
    description: "Minimalist interior design inspiration",
    status: "SCHEDULED",
    platform: "Instagram",
    scheduledAt: "2024-03-22T08:15:00Z",
  },
  {
    id: 7,
    imageUrl: "https://images.unsplash.com/photo-1556155092-490a1ba16284",
    description: "Team collaboration meeting in open office",
    status: "PROCESSING",
    platform: "LinkedIn",
    scheduledAt: "2024-03-12T13:45:00Z",
  },
  {
    id: 8,
    imageUrl: "https://images.unsplash.com/photo-1542385489-d10d9c792484",
    description: "Abstract architectural details close-up",
    status: "COMPLETED",
    platform: "Twitter",
    scheduledAt: "2024-03-08T10:30:00Z",
  },
];

export default function HistoryPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter & Sort State
  const [filters, setFilters] = useState<FilterState>({
    statuses: [],
    platforms: [],
    dateRange: "all",
  });
  const [sort, setSort] = useState<string>("newest");

  // Filter Logic
  const filteredItems = useMemo(() => {
    return historyItems
      .filter((item) => {
        // Status Filter
        if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) {
          return false;
        }
        // Platform Filter
        if (filters.platforms.length > 0 && !filters.platforms.includes(item.platform)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Sort Logic
        const dateA = new Date(a.scheduledAt).getTime();
        const dateB = new Date(b.scheduledAt).getTime();

        switch (sort) {
          case "oldest":
            return dateA - dateB;
          case "scheduled_asc":
            return dateA - dateB; // Same as oldest logic-wise if using scheduledAt for age
          case "scheduled_desc":
            return dateB - dateA;
          case "newest":
          default:
            return dateB - dateA;
        }
      });
  }, [filters, sort]);

  const user = {
    name: "Monkey d luffy",
    email: "monkeydluffy@gmail.com",
    avatar: "/mock-avatar.png",
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden p-2 lg:p-4 gap-4 relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

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

      {/* Right Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header with Custom Filter Content */}
        <div className="pb-2 lg:pb-4">
          <Header
            userName={user.name}
            userEmail={user.email}
            userAvatar={user.avatar}
            onMenuClick={() => setIsMobileMenuOpen(true)}
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

        {/* Main Content */}
        <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-4 py-6 lg:px-6 lg:py-8 scrollbar-hide">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-lg">No history items found.</p>
              <button
                onClick={() => setFilters({ statuses: [], platforms: [], dateRange: "all" })}
                className="mt-2 text-blue-500 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <HistoryCard
                  key={item.id}
                  imageUrl={item.imageUrl}
                  description={item.description}
                  status={item.status as any}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
