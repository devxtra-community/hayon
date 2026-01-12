"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/axios";
import { Sidebar, Header } from "@/components/dashboard";
import DeviceList from "@/components/DeviceList";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export default function DevicesPage() {
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

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="pb-2 lg:pb-4">
          <Header
            userName={user.name}
            userEmail={user.email}
            userAvatar={user.avatar}
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />
        </div>

        <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-4 py-6 lg:px-8 lg:py-8 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="group">
                  <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-black transition-colors" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Device Management</h1>
                <p className="text-gray-500 text-sm">
                  Manage your active sessions and logged-in devices
                </p>
              </div>
            </div>

            <DeviceList />
          </div>
        </main>
      </div>
    </div>
  );
}
