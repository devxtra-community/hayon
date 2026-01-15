"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/axios";
import { Facebook, Instagram, Globe, AtSign } from "lucide-react";
import { Platform, User, ViewMode } from "@/types/create-post";
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
  const [isGenerating, setIsGenerating] = useState(false);

  // Schedule State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timeZone, setTimeZone] = useState("");

  // --- Configurations ---
  const ALL_SUPPORTED_PLATFORMS = [
    {
      id: "facebook",
      name: "Facebook",
      icon: React.createElement(Facebook, { className: "w-5 h-5" }),
      color: "bg-blue-600",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: React.createElement(Instagram, { className: "w-5 h-5" }),
      color: "bg-pink-600",
    },
    {
      id: "threads",
      name: "Threads",
      icon: React.createElement(AtSign, { className: "w-5 h-5" }),
      color: "bg-black",
    },
    {
      id: "bluesky",
      name: "Blue Sky",
      icon: React.createElement(Globe, { className: "w-5 h-5" }),
      color: "bg-blue-500",
    },
    {
      id: "tumblr",
      name: "Tumblr",
      icon: React.createElement("span", { className: "font-bold text-lg leading-none" }, "t"),
      color: "bg-black",
    },
    {
      id: "mastodon",
      name: "Mastodon",
      icon: React.createElement("span", { className: "font-bold text-lg leading-none" }, "m"),
      color: "bg-purple-600",
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
      setMediaFiles((prev) => [...prev, ...newFiles]);

      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setFilePreviews((prev) => [...prev, ...newPreviews]);
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

  const handleGeneratePosts = async () => {
    if (selectedPlatforms.length === 0) return;
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
  };
}
