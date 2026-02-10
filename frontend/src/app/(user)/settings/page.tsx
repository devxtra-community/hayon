"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Sidebar, Header } from "@/components/shared";
import { cn } from "@/lib/utils";
import { ProfileCard } from "@/components/settings/ProfileCard";
import { PlanInfoCard } from "@/components/settings/PlanInfoCard";
import { TimezoneCard } from "@/components/settings/TimezoneCard";
import { ConnectedPlatformsCard } from "@/components/settings/ConnectedPlatformsCard";
import { User } from "@/types/user.types";
import { LoadingH } from "@/components/ui/loading-h";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [update, setUpdate] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.data.user);
      } catch (error) {
        console.error("Failed to fetch user", error);
      }
    };

    fetchUser();

    const fetchPlatforms = async () => {
      try {
        const { data } = await api.get("/platform/find");
        setConnectedPlatforms(data.data);
      } catch (error) {
        console.error("Failed to fetch platforms", error);
      }
    };
    fetchPlatforms();
  }, [update]);

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

      {/* Header */}
      <div className="pb-4">
        <Header
          userName={user?.name || ""}
          userEmail={user?.email || ""}
          userAvatar={user?.avatar || ""}
          onMenuClick={() => setIsMobileMenuOpen(true)}
        />
      </div>

      {/* Settings Content */}
      <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-6 py-8">
        {!user ? (
          <div className="flex items-center justify-center h-full">
            <LoadingH />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Profile Card */}
              <ProfileCard user={user} onUpdate={() => setUpdate(!update)} />

              {/* Plan Info Section */}
              <PlanInfoCard user={user} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Time Zone */}
              <TimezoneCard initialTimezone={user.timezone} onUpdate={() => setUpdate(!update)} />

              {/* Connect Platforms */}
              <ConnectedPlatformsCard
                connectedPlatforms={connectedPlatforms}
                onUpdate={() => setUpdate(!update)}
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
