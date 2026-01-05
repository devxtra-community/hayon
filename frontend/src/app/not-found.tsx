"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F7F7F7] flex flex-col items-center justify-center p-4 text-center">
      {/* Decorative Blur Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#318D62]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-md w-full">
        {/* Large 404 Text */}
        <h1 className="text-[150px] font-black text-[#318D62] leading-none select-none drop-shadow-sm opacity-90 tracking-tighter">
          404
        </h1>

        <div className="space-y-6 mt-8">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Page not found</h2>
          <p className="text-gray-500 text-lg">
            Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't
            exist.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              className="w-full sm:w-auto h-12 px-8 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>

            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button className="w-full h-12 px-8 rounded-full bg-[#318D62] hover:bg-[#287350] text-white shadow-lg shadow-[#318D62]/20 transition-all hover:scale-105">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 text-sm text-gray-400">Hayon Platform</div>
    </div>
  );
}
