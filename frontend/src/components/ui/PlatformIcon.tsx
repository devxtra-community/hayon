import Image from "next/image";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformIconProps {
  platform: string;
  className?: string;
  size?: number;
}

const LOGO_MAP: Record<string, string> = {
  facebook: "/images/platform-logos/facebook.png",
  instagram: "/images/platform-logos/instagram.png",
  threads: "/images/platform-logos/threads.png",
  bluesky: "/images/platform-logos/bluesky.png",
  mastodon: "/images/platform-logos/mastodon.png",
  tumblr: "/images/platform-logos/tumblr.png",
};

export default function PlatformIcon({ platform, className, size = 20 }: PlatformIconProps) {
  const p = platform.toLowerCase();
  const logoPath = LOGO_MAP[p];

  if (logoPath) {
    return (
      <div
        className={cn("relative rounded-full overflow-hidden flex-shrink-0", className)}
        style={{ width: size, height: size }}
      >
        <Image src={logoPath} alt={`${platform} logo`} fill className="object-cover" />
      </div>
    );
  }

  // Fallback for unknown platforms
  return <Globe className={className} size={size} />;
}
