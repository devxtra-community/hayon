"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import { Facebook, Instagram } from "lucide-react";
import Image from "next/image";
import { Platform, User, ViewMode, PlatformPost, PlatformConstraints } from "@/types/create-post";
import {
  SocialAccount,
  PLATFORM_CONSTRAINTS,
  GLOBAL_CONSTRAINTS,
  PlatformType,
} from "@hayon/schemas";

import React from "react";

export function useCreatePost() {
  // --- State ---
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("create");

  // Form State
  const [postText, setPostText] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  // Platforms & Generation
  const [availablePlatforms, setAvailablePlatforms] = useState<Platform[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [platformPosts, setPlatformPosts] = useState<Record<string, PlatformPost>>({});

  // Schedule State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timeZone, setTimeZone] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [platformWarnings, setPlatformWarnings] = useState<Record<string, string[]>>({});

  // --- Configurations ---
  const FRONTEND_PLATFORM_CONFIG: Record<
    string,
    { previewType: PlatformConstraints["previewType"] }
  > = {
    facebook: { previewType: "grid" },
    instagram: { previewType: "carousel" },
    threads: { previewType: "scroll" },
    bluesky: { previewType: "grid" },
    mastodon: { previewType: "grid" },
    tumblr: { previewType: "column" },
  };

  const getPlatformConstraints = (id: string): PlatformConstraints | undefined => {
    const base = PLATFORM_CONSTRAINTS[id as PlatformType];
    const fe = FRONTEND_PLATFORM_CONFIG[id];
    if (!base || !fe) return undefined;
    return { ...base, previewType: fe.previewType };
  };

  const ALL_SUPPORTED_PLATFORMS = [
    {
      id: "facebook",
      name: "Facebook",
      icon: React.createElement(Facebook, { className: "w-5 h-5" }),
      color: "bg-blue-600",
      constraints: getPlatformConstraints("facebook"),
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: React.createElement(Instagram, { className: "w-5 h-5" }),
      color: "bg-pink-600",
      constraints: getPlatformConstraints("instagram"),
    },
    {
      id: "threads",
      name: "Threads",
      icon: React.createElement(
        "div",
        { className: "relative w-full h-full scale-[0.6]" },
        React.createElement(Image, {
          src: "/images/logos/threads.png",
          alt: "Threads",
          fill: true,
          className: "object-contain",
        }),
      ),
      color: "bg-white border border-gray-100",
      constraints: getPlatformConstraints("threads"),
    },
    {
      id: "bluesky",
      name: "Blue Sky",
      icon: React.createElement(
        "div",
        { className: "relative w-full h-full scale-[0.7]" },
        React.createElement(Image, {
          src: "/images/logos/bluesky.png",
          alt: "Bluesky",
          fill: true,
          className: "object-contain",
        }),
      ),
      color: "bg-white border border-gray-100",
      constraints: getPlatformConstraints("bluesky"),
    },
    {
      id: "tumblr",
      name: "Tumblr",
      icon: React.createElement(
        "div",
        { className: "relative w-full h-full scale-[0.55]" },
        React.createElement(Image, {
          src: "/images/logos/tumblr.png",
          alt: "Tumblr",
          fill: true,
          className: "object-contain",
        }),
      ),
      color: "bg-white border border-gray-100",
      constraints: getPlatformConstraints("tumblr"),
    },
    {
      id: "mastodon",
      name: "Mastodon",
      icon: React.createElement(
        "div",
        { className: "relative w-full h-full scale-[0.7]" },
        React.createElement(Image, {
          src: "/images/logos/mastodon.png",
          alt: "Mastodon",
          fill: true,
          className: "object-contain",
        }),
      ),
      color: "bg-white border border-gray-100",
      constraints: getPlatformConstraints("mastodon"),
    },
  ];

  // --- Auth & Init ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch User
        const userRes = await api.get("/auth/me");
        setUser(userRes.data.data.user);
        setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);

        // Fetch Platforms
        const platformRes = await api.get("/platform/find");
        const data = platformRes.data.data;
        setConnectedAccounts(data);

        // Merge static config with dynamic connection status
        const platforms: Platform[] = ALL_SUPPORTED_PLATFORMS.map((p) => {
          const apiKey = p.id;
          let isConnected = false;

          if (data[apiKey]?.connected) isConnected = true;

          return {
            ...p,
            connected: isConnected,
          };
        });

        setAvailablePlatforms(platforms);
        // Select all connected by default
        setSelectedPlatforms(platforms.filter((p) => p.connected).map((p) => p.id));
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Edge Case: Max images limit
      if (mediaFiles.length + newFiles.length > GLOBAL_CONSTRAINTS.maxGlobalImages) {
        setErrors((prev) => [
          ...prev,
          `Maximum of ${GLOBAL_CONSTRAINTS.maxGlobalImages} images allowed across all platforms.`,
        ]);
        return;
      }

      // Edge Case: File size check
      const oversizedFiles = newFiles.filter((f) => f.size > GLOBAL_CONSTRAINTS.maxGlobalFileSize);
      if (oversizedFiles.length > 0) {
        const limitMB = Math.floor(GLOBAL_CONSTRAINTS.maxGlobalFileSize / (1024 * 1024));
        setErrors((prev) => [...prev, `Some files are too large (max ${limitMB}MB).`]);
        return;
      }

      setMediaFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setFilePreviews((prev) => [...prev, ...newPreviews]);
      setErrors([]); // Clear errors on success
    }
  };

  const removeFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const togglePlatform = (id: string, connected: boolean) => {
    if (!connected) return;
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const validatePost = () => {
    const globalErrors: string[] = [];
    const newWarnings: Record<string, string[]> = {};

    if (!postText && mediaFiles.length === 0) {
      globalErrors.push("Post must have text or media.");
    }

    selectedPlatforms.forEach((platformId) => {
      const platform = ALL_SUPPORTED_PLATFORMS.find((p) => p.id === platformId);
      if (!platform || !platform.constraints) return;

      const { maxChars, maxImages, requiresImage, maxFileSize } = platform.constraints;
      const pWarnings: string[] = [];

      // Character Count Validation
      if (postText.length > maxChars) {
        pWarnings.push(`Text exceeds ${maxChars} chars.`);
      }

      // Image Count Validation
      if (mediaFiles.length > maxImages) {
        pWarnings.push(`Max ${maxImages} images/videos.`);
      }

      // Required Image Validation (Instagram)
      if (requiresImage && mediaFiles.length === 0) {
        pWarnings.push(`Requires at least one media item.`);
      }

      // File Size Validation
      if (maxFileSize) {
        const oversizedFiles = mediaFiles.filter((f) => f.size > maxFileSize);
        if (oversizedFiles.length > 0) {
          const limitKB = Math.floor(maxFileSize / 1024);
          pWarnings.push(`File too large (max ${limitKB}KB).`);
        }
      }

      if (pWarnings.length > 0) {
        newWarnings[platformId] = pWarnings;
      }
    });

    setErrors(globalErrors);
    setPlatformWarnings(newWarnings);
    return globalErrors.length === 0;
  };

  const handleGeneratePosts = async () => {
    if (selectedPlatforms.length === 0) return;
    if (!validatePost()) return;

    setIsGenerating(true);

    // Initialize platform-specific posts with current global data
    const initialPlatformPosts: Record<string, PlatformPost> = {};
    selectedPlatforms.forEach((id) => {
      initialPlatformPosts[id] = {
        text: postText,
        mediaFiles: [...mediaFiles],
        filePreviews: [...filePreviews],
      };
    });
    setPlatformPosts(initialPlatformPosts);

    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGenerating(false);
    setViewMode("preview");
  };

  const updatePlatformPost = (id: string, updates: Partial<PlatformPost>) => {
    setPlatformPosts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...updates,
      },
    }));
    // Clear global errors as we are now in per-platform edit mode
    setErrors([]);
    setPlatformWarnings((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const refinePlatformPostWithLLM = async (id: string, prompt: string) => {
    const currentPost = platformPosts[id];
    if (!currentPost) return;

    setIsGenerating(true);
    try {
      // Simulate LLM Call - In a real app, this would call your backend
      // and use the prompt to refine currentPost.text for specific platform
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const platformName = ALL_SUPPORTED_PLATFORMS.find((p) => p.id === id)?.name || id;
      const refinedText = `${currentPost.text}\n\n[AI Refined for ${platformName} using prompt: "${prompt}"]`;

      updatePlatformPost(id, { text: refinedText });
    } catch (error) {
      console.error("LLM Refinement failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return [];

    const uploadPromises = files.map(async (file) => {
      // 1. Get Presigned URL
      const { data } = await api.post("/posts/media/upload", {
        contentType: file.type,
      });

      const { uploadUrl, s3Url, s3Key } = data.data;

      // 2. Upload to S3
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      return {
        s3Url,
        s3Key,
        mimeType: file.type,
      };
    });

    return Promise.all(uploadPromises);
  };

  const handlePostNow = async () => {
    // 1. Validate again specifically for blocking errors
    const isValid = validatePost(); // Re-runs validation and updates state
    if (!isValid) return;

    // Check if any selected platform has warnings (which are effectively errors for posting)
    // We need to re-derive them because state updates (setPlatformWarnings) might not be immediate available
    // in this closure if we rely just on the state variable 'platformWarnings'.
    // However, since we are inside a function, we can check logic directly or use a synchronous check helper.

    // Let's do a synchronous check for blocking constraints
    const blockingPlatforms: string[] = [];
    selectedPlatforms.forEach((pId) => {
      const constraints = PLATFORM_CONSTRAINTS[pId as PlatformType];
      if (!constraints) return;
      const { maxChars, maxImages, requiresImage, maxFileSize } = constraints;

      if (postText.length > maxChars) blockingPlatforms.push(pId);
      if (mediaFiles.length > maxImages) blockingPlatforms.push(pId);
      if (requiresImage && mediaFiles.length === 0) blockingPlatforms.push(pId);
      if (maxFileSize && mediaFiles.some((f) => f.size > maxFileSize)) blockingPlatforms.push(pId);
    });

    if (blockingPlatforms.length > 0) {
      setErrors([`Cannot post: Fix issues for ${blockingPlatforms.join(", ")}`]);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      // 1. Upload Global Media (if any)
      // Note: If platformSpecificContent is fully used, we might not strictly need global media,
      // but we send it as the default 'content'.
      const globalMediaItems = await uploadFiles(mediaFiles);

      // 2. Prepare Platform Specific Content
      const platformSpecificContent: Record<string, any> = {};

      // If we are in preview mode, platformPosts is populated.
      // We need to upload files for each platform if they are different/new.
      // Optimization: We could track if files are the same as global to avoid re-uploading,
      // but for now, to ensure correctness of per-platform edits, we upload what is in platformPost.
      // A better optimization would be deduping based on file object reference or hash.

      const platformPromises = selectedPlatforms.map(async (platformId) => {
        const pPost = platformPosts[platformId];
        if (pPost) {
          // Check if files are exactly the same objects as global mediaFiles
          // If so, reuse globalMediaItems
          let pMediaItems: any[] = [];

          // Simple equality check for exact file arrays
          const isSameFiles =
            pPost.mediaFiles.length === mediaFiles.length &&
            pPost.mediaFiles.every((f, i) => f === mediaFiles[i]);

          if (isSameFiles) {
            pMediaItems = globalMediaItems;
          } else {
            // Upload platform specific files
            pMediaItems = await uploadFiles(pPost.mediaFiles);
          }

          platformSpecificContent[platformId] = {
            text: pPost.text,
            mediaItems: pMediaItems,
          };
        }
      });

      await Promise.all(platformPromises);

      // 3. Send Create Post Request
      const payload = {
        content: {
          text: postText, // Global text fallback
          mediaItems: globalMediaItems,
        },
        selectedPlatforms,
        platformSpecificContent,
        scheduledAt:
          scheduleDate && scheduleTime
            ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
            : undefined,
        timezone: timeZone,
      };

      const res = await api.post("/posts", payload);

      if (res.data?.data?.postId) {
        // Post created successfully
      }

      setIsSubmitting(false);
      setIsSuccess(true);

      // Auto-reset and navigate back after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setViewMode("create");
        setPostText("");
        setMediaFiles([]);
        setFilePreviews([]);
        setPlatformPosts({});
        setErrors([]);
      }, 3000);
    } catch (error) {
      console.error("Failed to post", error);
      setErrors(["Failed to create post. Please try again."]);
      setIsSubmitting(false);
    }
  };

  const handleScheduleConfirm = () => {
    setIsScheduleOpen(false);
    handlePostNow();
  };

  return {
    user,
    viewMode,
    setViewMode,
    postText,
    setPostText,
    mediaFiles,
    filePreviews,
    availablePlatforms,
    setAvailablePlatforms,
    selectedPlatforms,
    setSelectedPlatforms,
    isGenerating,
    isScheduleOpen,
    setIsScheduleOpen,
    scheduleDate,
    setScheduleDate,
    scheduleTime,
    setScheduleTime,
    isSubmitting,
    isSuccess,
    setIsSuccess,
    timeZone,
    handleFileChange,
    removeFile,
    togglePlatform,
    handleGeneratePosts,
    handlePostNow,
    handleScheduleConfirm,
    connectedAccounts,
    errors,
    setErrors,
    platformWarnings,
    platformPosts,
    updatePlatformPost,
    refinePlatformPostWithLLM,
  };
}
