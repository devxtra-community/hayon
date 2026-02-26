"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Sidebar, Header } from "@/components/shared";
import DeviceList from "@/components/DeviceList";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export default function DevicesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden p-2 gap-4 relative">
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

      <div className="flex-1 flex flex-col h-full bg-[#F7F7F7] rounded-[2.5rem] overflow-hidden">
        {user && (
          <div className="px-4 pt-6 lg:px-8 lg:pt-8 bg-[#F7F7F7]">
            <Header
              userName={user.name}
              userEmail={user.email}
              userAvatar={user.avatar}
              onMenuClick={() => setIsMobileMenuOpen(true)}
              title="Device Management"
              subtitle="Manage your active sessions"
              showBackButton
              onBack={() => router.push("/dashboard")}
            />
          </div>
        )}

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            <DeviceList />
          </div>
        </main>
      </div>
    </div>
  );
}
