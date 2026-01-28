export const PLATFORMS = [
  "facebook",
  "instagram",
  "threads",
  "bluesky",
  "mastodon",
  "tumblr",
] as const;

export type PlatformType = (typeof PLATFORMS)[number];

export interface PlatformConstraints {
  maxChars: number;
  maxImages: number;
  requiresImage: boolean;
  maxFileSize?: number; // in bytes
  allowedMimeTypes?: string[];
}

export const PLATFORM_CONSTRAINTS: Record<PlatformType, PlatformConstraints> = {
  facebook: {
    maxImages: 10,
    maxChars: 63206,
    requiresImage: false,
  },
  instagram: {
    maxImages: 10,
    maxChars: 2200,
    requiresImage: true,
  },
  threads: {
    maxImages: 20,
    maxChars: 500,
    requiresImage: false,
  },
  bluesky: {
    maxImages: 4,
    maxChars: 300,
    requiresImage: false,
    maxFileSize: 900 * 1024, // 900KB safety limit
  },
  mastodon: {
    maxImages: 4,
    maxChars: 500,
    requiresImage: false,
  },
  tumblr: {
    maxImages: 10,
    maxChars: 4096,
    requiresImage: false,
  },
};

export const GLOBAL_CONSTRAINTS = {
  maxGlobalImages: 20,
  maxGlobalFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "video/mp4",
    "video/quicktime",
  ],
};
