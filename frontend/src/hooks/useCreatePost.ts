"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/axios";
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
  const [existingMedia, setExistingMedia] = useState<
    { s3Url: string; mimeType?: string; s3Key?: string }[]
  >([]);
  const [draftId, setDraftId] = useState<string | null>(null); // Track if editing existing draft

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
  const [successMessage, setSuccessMessage] = useState("");
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
      icon: React.createElement(
        "div",
        { className: "relative w-full h-full rounded-full overflow-hidden" },
        React.createElement(Image, {
          src: "/images/platform-logos/facebook.png",
          alt: "Facebook",
          fill: true,
          className: "object-cover",
        }),
      ),
      color: "bg-blue-600",
      constraints: getPlatformConstraints("facebook"),
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: React.createElement(
        "div",
        { className: "relative w-full h-full rounded-full overflow-hidden" },
        React.createElement(Image, {
          src: "/images/platform-logos/instagram.png",
          alt: "Instagram",
          fill: true,
          className: "object-cover",
        }),
      ),
      color: "bg-pink-600",
      constraints: getPlatformConstraints("instagram"),
    },
    {
      id: "threads",
      name: "Threads",
      icon: React.createElement(
        "div",
        { className: "relative w-full h-full rounded-full overflow-hidden" },
        React.createElement(Image, {
          src: "/images/platform-logos/threads.png",
          alt: "Threads",
          fill: true,
          className: "object-cover",
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
        { className: "relative w-full h-full rounded-full overflow-hidden" },
        React.createElement(Image, {
          src: "/images/platform-logos/bluesky.png",
          alt: "Bluesky",
          fill: true,
          className: "object-cover",
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
        { className: "relative w-full h-full rounded-full overflow-hidden" },
        React.createElement(Image, {
          src: "/images/platform-logos/tumblr.png",
          alt: "Tumblr",
          fill: true,
          className: "object-cover",
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
        { className: "relative w-full h-full rounded-full overflow-hidden" },
        React.createElement(Image, {
          src: "/images/platform-logos/mastodon.png",
          alt: "Mastodon",
          fill: true,
          className: "object-cover",
        }),
      ),
      color: "bg-white border border-gray-100",
      constraints: getPlatformConstraints("mastodon"),
    },
  ];

  // --- Auth & Init ---
  const searchParams = useSearchParams();

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

        // Select all connected by default ONLY if NOT loading a draft
        const draftIdParam = searchParams.get("draftId");
        if (!draftIdParam) {
          setSelectedPlatforms(platforms.filter((p) => p.connected).map((p) => p.id));
        }
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchData();
  }, [searchParams]);

  useEffect(() => {
    if (isScheduleOpen && !scheduleDate && !scheduleTime) {
      const now = new Date();
      // Format: YYYY-MM-DD (Local)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      // Format: HH:mm (Local 24h)
      const timeStr = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      setScheduleDate(dateStr);
      setScheduleTime(timeStr);
    }
  }, [isScheduleOpen, scheduleDate, scheduleTime]);

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
    const existingCount = existingMedia.length;
    if (index < existingCount) {
      setExistingMedia((prev) => prev.filter((_, i) => i !== index));
    } else {
      const relativeIndex = index - existingCount;
      setMediaFiles((prev) => prev.filter((_, i) => i !== relativeIndex));
    }
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

      const { maxChars, maxImages, requiresImage, maxFileSize, allowedMimeTypes } =
        platform.constraints;
      const pWarnings: string[] = [];

      // Character Count Validation
      if (postText.length > maxChars) {
        pWarnings.push(`Text exceeds ${maxChars} chars.`);
      }

      // Image Count Validation
      if (mediaFiles.length > maxImages) {
        pWarnings.push(`Max ${maxImages} images/videos.`);
      }

      // MIME Type Validation
      if (allowedMimeTypes) {
        // Check new files
        const unsupportedFiles = mediaFiles.filter((f) => !allowedMimeTypes.includes(f.type));
        if (unsupportedFiles.length > 0) {
          pWarnings.push(`Format not supported. Use: ${allowedMimeTypes.join(", ")}`);
        }
        // Check existing media from drafts
        const unsupportedExisting = existingMedia.filter(
          (m) => m.mimeType && !allowedMimeTypes.includes(m.mimeType),
        );
        if (unsupportedExisting.length > 0) {
          pWarnings.push(`Some drafted items have unsupported formats.`);
        }
      }

      // Required Image Validation (Instagram)
      if (requiresImage && mediaFiles.length === 0 && existingMedia.length === 0) {
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
        existingMedia: [...existingMedia],
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

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string); // "data:<mime>;base64,..."
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  const refinePlatformPostWithLLM = async (id: string, prompt: string) => {
    const currentPost = platformPosts[id];
    if (!currentPost) return;

    setIsGenerating(true);
    try {
      const base64List = await Promise.all(currentPost.mediaFiles.map(fileToDataUrl));

      const context =
        currentPost.text.trim().length > 0
          ? `Current draft:\n${currentPost.text}\n\nUser request:\n${prompt}`
          : prompt;

      const response = await api.post(`/generate/captions/${id}`, {
        prompt: context,
        media: base64List,
      });

      console.log(response);

      const refinedText: string | undefined =
        response.data?.data?.candidates[0].content.parts[0].text;

      console.log(refinedText);
      if (!refinedText) {
        throw new Error("AI refinement returned no text");
      }

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
      if (requiresImage && mediaFiles.length === 0 && existingMedia.length === 0)
        blockingPlatforms.push(pId); // Fixed: check existingMedia too
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
          let pMediaItems: any[] = [];

          const isSameFiles =
            pPost.mediaFiles.length === mediaFiles.length &&
            pPost.mediaFiles.every((f, i) => f === mediaFiles[i]);

          if (isSameFiles) {
            // If platform has specific existing media, prefer it. Otherwise use global.
            const baseExisting =
              pPost.existingMedia && pPost.existingMedia.length > 0
                ? pPost.existingMedia
                : pPost.existingMedia === undefined
                  ? existingMedia
                  : []; // If explicitly empty, keep it empty

            pMediaItems = [...baseExisting, ...globalMediaItems];
          } else {
            // Merge platform specific existing media with platform specific new uploads
            pMediaItems = [
              ...(pPost.existingMedia || []),
              ...(await uploadFiles(pPost.mediaFiles)),
            ];
          }

          platformSpecificContent[platformId] = {
            text: pPost.text,
            mediaItems: pMediaItems,
          };
        }
      });

      await Promise.all(platformPromises);

      // 3. Send Create or Update Request
      const payload = {
        content: {
          text: postText, // Global text fallback
          mediaItems: [...existingMedia, ...globalMediaItems], // Fixed: include existingMedia
        },
        selectedPlatforms,
        platformSpecificContent,
        scheduledAt:
          scheduleDate && scheduleTime
            ? new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
            : undefined,
        timezone: timeZone,
        status: scheduleDate && scheduleTime ? "SCHEDULED" : "PENDING",
      };

      let res;
      if (draftId) {
        // Update existing draft to PENDING/SCHEDULED
        res = await api.put(`/posts/${draftId}`, payload);
      } else {
        // Create new post
        res = await api.post("/posts", payload);
      }

      if (res.data?.data?.postId) {
        setSuccessMessage(
          scheduleDate && scheduleTime
            ? "Your post has been successfully scheduled."
            : "Your post has been successfully published.",
        );
        setIsSuccess(true);
      }

      setIsSubmitting(false);

      // Auto-reset and navigate back after 3 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setSuccessMessage("");
        setViewMode("create");
        setPostText("");
        setMediaFiles([]);
        setFilePreviews([]);
        setPlatformPosts({});
        setErrors([]);
        setExistingMedia([]);
        setDraftId(null); // Reset draftId
      }, 3000);
    } catch (error) {
      console.error("Failed to post", error);
      setErrors(["Failed to create post. Please try again."]);
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    // Basic validation - post must have text or media
    if (!postText && mediaFiles.length === 0) {
      setErrors(["Post must have text or media."]);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      // 1. Upload Global Media (if any)
      const globalMediaItems = await uploadFiles(mediaFiles);

      // 2. Prepare Platform Specific Content (same as handlePostNow)
      const platformSpecificContent: Record<string, any> = {};

      const platformPromises = selectedPlatforms.map(async (platformId) => {
        const pPost = platformPosts[platformId];
        if (pPost) {
          let pMediaItems: any[] = [];

          const isSameFiles =
            pPost.mediaFiles.length === mediaFiles.length &&
            pPost.mediaFiles.every((f, i) => f === mediaFiles[i]);

          if (isSameFiles) {
            // If platform has specific existing media, prefer it. Otherwise use global.
            const baseExisting =
              pPost.existingMedia && pPost.existingMedia.length > 0
                ? pPost.existingMedia
                : pPost.existingMedia === undefined
                  ? existingMedia
                  : []; // If explicitly empty, keep it empty

            pMediaItems = [...baseExisting, ...globalMediaItems];
          } else {
            // Merge platform specific existing media with platform specific new uploads
            pMediaItems = [
              ...(pPost.existingMedia || []),
              ...(await uploadFiles(pPost.mediaFiles)),
            ];
          }

          platformSpecificContent[platformId] = {
            text: pPost.text,
            mediaItems: pMediaItems,
          };
        }
      });

      await Promise.all(platformPromises);

      // 3. Send Create or Update Request based on draftId
      const payload = {
        content: {
          text: postText,
          mediaItems: [...existingMedia, ...globalMediaItems],
        },
        selectedPlatforms,
        platformSpecificContent,
        status: "DRAFT",
        timezone: timeZone,
      };

      let res;
      if (draftId) {
        // Update existing draft
        res = await api.put(`/posts/${draftId}`, payload);
      } else {
        // Create new draft
        res = await api.post("/posts", payload);
      }

      if (res.data?.data?.postId) {
        setSuccessMessage("Your draft has been saved successfully.");
        setIsSuccess(true);
      }

      setIsSubmitting(false);

      // Auto-reset after showing success
      setTimeout(() => {
        setIsSuccess(false);
        setSuccessMessage("");
        setViewMode("create");
        setPostText("");
        setMediaFiles([]);
        setFilePreviews([]);
        setPlatformPosts({});
        setErrors([]);
        setDraftId(null);
        setExistingMedia([]);
      }, 2000);
    } catch (error: any) {
      console.error("Failed to save draft", error);
      if (error.response?.data) {
        console.error("Backend validation errors:", JSON.stringify(error.response.data, null, 2));
      }
      setErrors(["Failed to save draft. Please try again."]);
      setIsSubmitting(false);
    }
  };

  const loadDraft = async (id: string) => {
    try {
      const res = await api.get(`/posts/${id}`);
      const draft = res.data.data.post;

      // Set draft ID
      setDraftId(id);

      // Load content
      setPostText(draft.content.text);

      // Load platforms
      setSelectedPlatforms(draft.selectedPlatforms);

      // Load media - convert S3 URLs to file previews
      if (draft.content.mediaItems && draft.content.mediaItems.length > 0) {
        setExistingMedia(draft.content.mediaItems);
        setFilePreviews(draft.content.mediaItems.map((item: any) => item.s3Url));
        // Note: We can't recreate File objects from URLs, so mediaFiles stays empty
        // The backend already has the S3 URLs, so we just need the previews
      }

      // Load platform-specific content if exists
      if (draft.platformSpecificContent && Object.keys(draft.platformSpecificContent).length > 0) {
        const platformPostsData: Record<string, PlatformPost> = {};
        Object.entries(draft.platformSpecificContent).forEach(
          ([platformId, content]: [string, any]) => {
            platformPostsData[platformId] = {
              text: content.text || draft.content.text,
              mediaFiles: [], // Can't recreate files
              filePreviews: content.mediaItems?.map((item: any) => item.s3Url) || [],
              existingMedia: content.mediaItems || [],
            };
          },
        );
        setPlatformPosts(platformPostsData);
      }

      // Automatically switch to preview mode when loading a draft
      setViewMode("preview");
    } catch (error) {
      console.error("Failed to load draft", error);
      setErrors(["Failed to load draft."]);
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
    successMessage,
    timeZone,
    handleFileChange,
    removeFile,
    togglePlatform,
    handleGeneratePosts,
    handlePostNow,
    handleSaveDraft,
    handleScheduleConfirm,
    connectedAccounts,
    errors,
    setErrors,
    platformWarnings,
    platformPosts,
    updatePlatformPost,
    refinePlatformPostWithLLM,
    loadDraft,
    draftId,
  };
}
