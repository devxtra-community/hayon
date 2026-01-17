"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import { Facebook, Instagram } from "lucide-react";
import Image from "next/image";
import { Platform, User, ViewMode } from "@/types/create-post";
import { SocialAccount } from "@hayon/schemas";
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

  // Schedule State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timeZone, setTimeZone] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  // --- Configurations ---
  const PLATFORM_CONSTRAINTS: Record<string, Platform["constraints"]> = {
    facebook: {
      maxImages: 10,
      maxChars: 63206,
      requiresImage: false,
      previewType: "grid",
    },
    instagram: {
      maxImages: 10,
      maxChars: 2200,
      requiresImage: true,
      previewType: "carousel",
    },
    threads: {
      maxImages: 20,
      maxChars: 500,
      requiresImage: false,
      previewType: "scroll",
    },
    bluesky: {
      maxImages: 4,
      maxChars: 300,
      requiresImage: false,
      previewType: "grid",
    },
    mastodon: {
      maxImages: 4,
      maxChars: 500,
      requiresImage: false,
      previewType: "grid",
    },
    tumblr: {
      maxImages: 10,
      maxChars: 4096,
      requiresImage: false,
      previewType: "column",
    },
  };

  const ALL_SUPPORTED_PLATFORMS = [
    {
      id: "facebook",
      name: "Facebook",
      icon: React.createElement(Facebook, { className: "w-5 h-5" }),
      color: "bg-blue-600",
      constraints: PLATFORM_CONSTRAINTS.facebook,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: React.createElement(Instagram, { className: "w-5 h-5" }),
      color: "bg-pink-600",
      constraints: PLATFORM_CONSTRAINTS.instagram,
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
      constraints: PLATFORM_CONSTRAINTS.threads,
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
      constraints: PLATFORM_CONSTRAINTS.bluesky,
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
      constraints: PLATFORM_CONSTRAINTS.tumblr,
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
      constraints: PLATFORM_CONSTRAINTS.mastodon,
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

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((data as any)[apiKey]?.connected) isConnected = true;

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

      // Edge Case: Max images limit (e.g., 20 globally for threads, but we stick to a reasonable max)
      const MAX_GLOBAL_IMAGES = 20;
      if (mediaFiles.length + newFiles.length > MAX_GLOBAL_IMAGES) {
        setErrors((prev) => [...prev, `Maximum of ${MAX_GLOBAL_IMAGES} images allowed across all platforms.`]);
        return;
      }

      // Edge Case: File size check (e.g., 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      const oversizedFiles = newFiles.filter((f) => f.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        setErrors((prev) => [...prev, "Some files are too large (max 10MB)."]);
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
    const newErrors: string[] = [];

    selectedPlatforms.forEach((platformId) => {
      const platform = ALL_SUPPORTED_PLATFORMS.find((p) => p.id === platformId);
      if (!platform || !platform.constraints) return;

      const { maxChars, maxImages, requiresImage } = platform.constraints;

      // Character Count Validation
      if (postText.length > maxChars) {
        newErrors.push(`${platform.name} allows maximum ${maxChars} characters.`);
      }

      // Image Count Validation
      if (mediaFiles.length > maxImages) {
        newErrors.push(`${platform.name} allows maximum ${maxImages} images.`);
      }

      // Required Image Validation (Instagram)
      if (requiresImage && mediaFiles.length === 0) {
        newErrors.push(`${platform.name} requires at least one image/video.`);
      }
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleGeneratePosts = async () => {
    if (selectedPlatforms.length === 0) return;
    if (!validatePost()) return;

    setIsGenerating(true);
    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGenerating(false);
    setViewMode("preview");
  };

  const handlePostNow = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setIsSuccess(true);

    // Reset after success
    setTimeout(() => {
      setIsSuccess(false);
      setViewMode("create");
      setPostText("");
      setMediaFiles([]);
      setFilePreviews([]);
    }, 2000);
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
  };
}
