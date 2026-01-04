"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
export function BackButton() {
  const router = useRouter();
  return (
    <Button variant="outline" className="absolute top-8 left-8 z-20" onClick={() => router.back()}>
      <ArrowLeft className="w-4 h-4 mr-2" />
      Go Backey
    </Button>
  );
}
