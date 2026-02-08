import { Facebook, Instagram, Twitter, Linkedin, Globe, Ghost } from "lucide-react";

// Note: Lucide React doesn't have all icons (Threads, Bluesky, Mastodon might need custom SVGs or fallbacks)
// For now, mapping best closest icons or using generic Globe.

interface PlatformIconProps {
  platform: string;
  className?: string;
  size?: number;
}

export default function PlatformIcon({ platform, className, size = 20 }: PlatformIconProps) {
  const p = platform.toLowerCase();

  switch (p) {
    case "facebook":
      return <Facebook className={className} size={size} />;
    case "instagram":
      return <Instagram className={className} size={size} />;
    case "twitter":
    case "x":
      return <Twitter className={className} size={size} />;
    case "linkedin":
      return <Linkedin className={className} size={size} />;
    // Fallbacks for newer platforms not in standard set
    case "threads":
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          width={size}
          height={size}
        >
          <path d="M12 2a10 10 0 1 0 10 10c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10a10 10 0 0 0 10-10" />
          <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0" />
        </svg> // Simple @ symbol approximation
      );
    case "bluesky":
      return <Globe className={className} size={size} />; // Placeholder
    case "mastodon":
      return <Ghost className={className} size={size} />; // Placeholder because Mastodon is an elephant
    default:
      return <Globe className={className} size={size} />;
  }
}
