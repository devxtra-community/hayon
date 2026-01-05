// app/(auth)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getAccessToken, setAccessToken } from "@/lib/axios";
import { ToastProvider } from "@/context/ToastContext";

interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();

      if (!token) {
        try {
          const { data } = await api.post("/auth/refresh");
          setAccessToken(data.data.accessToken);
        } catch {
          setIsChecking(false);
          return;
        }
      }

      try {
        const { data } = await api.get("/auth/me");
        const user: User = data.data.user;

        if (user.role === "admin") {
          router.push("/admin/dashboard");
          return;
        } else if (user.role === "user") {
          router.push("/dashboard");
          return;
        }
      } catch {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading...</p>
      </div>
    );
  }

  return <ToastProvider>{children}</ToastProvider>;
}
