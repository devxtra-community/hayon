"use client";

import { LoadingH } from "@/components/ui/loading-h";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <LoadingH theme="admin" />
    </div>
  );
}
