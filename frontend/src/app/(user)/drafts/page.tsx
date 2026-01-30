"use client";

import { useState } from "react";
import { Sidebar, Header } from "@/components/dashboard";
import { DraftCard } from "@/components/drafts/DraftCard";
import { cn } from "@/lib/utils";

// Mock Data
const draftItems = [
  {
    id: 1,
    title:
      "A breathtaking aerial view of a bustling cyberpunk metropolis A breathtaking aerial view.",
    date: "2024-03-20",
    images: [
      "https://images.unsplash.com/photo-1518005020951-ecc8e5cc6991",
      "https://images.unsplash.com/photo-1542385489-d10d9c792484",
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205",
    ],
  },
  {
    id: 2,
    title: "Another post description that is slightly longer to test the read more function.",
    date: "2024-03-22",
    images: [
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c",
      "https://images.unsplash.com/photo-1593642532400-91a02925d947",
      "https://images.unsplash.com/photo-1493612276216-9c5901955d43",
    ],
  },
  {
    id: 3,
    title: "Short title.",
    date: "2024-03-25",
    images: [
      "https://images.unsplash.com/photo-1556155092-490a1ba16284",
      "https://images.unsplash.com/photo-1518005020951-ecc8e5cc6991",
      "https://images.unsplash.com/photo-1542385489-d10d9c792484",
    ],
  },
];

export default function DraftsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = draftItems.filter(
    (item) => item.title.toLowerCase().includes(searchQuery.toLowerCase()),
    // Add date filtering logic if date string search is required, currently filtering by title contains
  );

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
        {/* Header */}
        <div className="pb-2 lg:pb-4">
          <Header
            userName={user.name}
            userEmail={user.email}
            userAvatar={user.avatar}
            onMenuClick={() => setIsMobileMenuOpen(true)}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-4 py-6 lg:px-6 lg:py-8 scrollbar-hide">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-lg">No drafts found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <DraftCard key={item.id} title={item.title} images={item.images} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
