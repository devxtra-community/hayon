"use client";

import { useEffect, useState } from "react";
import { Sidebar, Header } from "@/components/shared";
import { api } from "@/lib/axios";
import { User } from "@/types/create-post";
import CalendarComponent from "@/components/calendar/CalendarComponent";
import { cn } from "@/lib/utils";
import { LoadingH } from "@/components/ui/loading-h";

export default function CalendarPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.data.user);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchUser();
  }, []);

  return (
    <>
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full bg-[#F7F7F7] rounded-[2.5rem] overflow-hidden">
        {user && (
          <div className="px-4 pt-6 lg:px-8 lg:pt-8 bg-[#F7F7F7] lg:hidden">
            <Header
              userName={user.name}
              userEmail={user.email}
              userAvatar={user.avatar}
              onMenuClick={() => setIsMobileMenuOpen(true)}
              title="Calendar"
              subtitle="Plan and schedule your social content"
            />
          </div>
        )}

        {/* Calendar Content */}
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 overflow-y-auto custom-scrollbar">
          {!user ? (
            <div className="flex items-center justify-center h-full">
              <LoadingH />
            </div>
          ) : (
            <CalendarComponent />
          )}
        </main>
      </div>
    </>
  );
}
