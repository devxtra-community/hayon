"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}

export function PreviewImage({
  src,
  alt,
  className,
  fill = true,
  width,
  height,
}: PreviewImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      className={cn(
        "relative w-full h-full bg-gray-50 flex items-center justify-center overflow-hidden",
        className,
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/80 backdrop-blur-[2px]">
          <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
        </div>
      )}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={cn(
          "transition-all duration-300",
          fill ? "object-cover" : "",
          isLoading ? "scale-105 blur-sm opacity-50" : "scale-100 blur-0 opacity-100",
        )}
        onLoadingComplete={() => setIsLoading(false)}
      />
    </div>
  );
}
