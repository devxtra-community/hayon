// app/(protected)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getAccessToken, setAccessToken } from "@/lib/axios";
import { ToastProvider } from "@/context/ToastContext";
import { LoadingH } from "@/components/ui/loading-h";
import { Sidebar } from "@/components/shared";

interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      let token = getAccessToken();

      if (!token) {
        try {
          const { data } = await api.post("/auth/refresh");
          setAccessToken(data.data.accessToken);
          token = data.data.accessToken;
        } catch {
          router.push("/login");
          return;
        }
      }

      try {
        const { data } = await api.get("/auth/me");
        const user: User = data.data.user;

        if (user.role === "admin") {
          router.push("/admin/dashboard");
          return;
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.log(error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  return (
    <ToastProvider>
      <div className="flex h-screen bg-white overflow-hidden p-2 lg:p-4 gap-4 relative">
        {/* Persistent Sidebar (Desktop) */}
        <div className="hidden lg:block h-full">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {isLoading ? (
            <div className="flex-1 flex flex-col h-full">
              {/* Placeholder Header */}
              <div className="pb-2 lg:pb-4">
                <div className="h-[13vh] bg-[#F7F7F7] rounded-[1rem] animate-pulse" />
              </div>
              <main className="flex-1 bg-[#F7F7F7] rounded-3xl flex items-center justify-center">
                <LoadingH />
              </main>
            </div>
          ) : !isAuthenticated ? null : (
            children
          )}
        </div>
      </div>
    </ToastProvider>
  );
}
