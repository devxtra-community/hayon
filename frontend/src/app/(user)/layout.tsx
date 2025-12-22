// app/(protected)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getAccessToken, setAccessToken } from "@/lib/axios";

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
