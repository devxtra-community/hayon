"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BlueskyConnectModal } from "@/components/dashboard";
import { api } from "@/lib/axios";
import { useToast } from "@/context/ToastContext";
import { SocialAccount } from "@hayon/schemas";
import { ConnectionTutorialModal } from "./ConnectionTutorialModal";
import { HelpCircle, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectedPlatformsCardProps {
  connectedPlatforms: SocialAccount | null;
  onUpdate: () => void;
}

interface PlatformInfo {
  name: string;
  status: "connected" | "disconnected";
  color: string;
  icon: React.ReactNode;
  userAvatar?: string;
  displayName?: string;
  handle?: string;
  platformId?: string;
  expiresAt?: Date | string;
}

export const ConnectedPlatformsCard = ({
  connectedPlatforms,
  onUpdate,
}: ConnectedPlatformsCardProps) => {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isBlueskyModalOpen, setIsBlueskyModalOpen] = useState(false);
  const [isDisconnectAlertOpen, setIsDisconnectAlertOpen] = useState(false);
  const [platformToDelete, setPlatformToDelete] = useState<{
    name: string;
    key: "bluesky" | "facebook" | "threads" | "mastodon" | "tumblr";
  } | null>(null);
  const [isTumblrDisconnectAlertOpen, setIsTumblrDisconnectAlertOpen] = useState(false);
  const [isMastodonConnectAlertOpen, setIsMastodonConnectAlertOpen] = useState(false);
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});

  const handleRefresh = async (platformName: string) => {
    let key = platformName.toLowerCase();
    if (key === "instagram" || key === "facebook") {
      key = "facebook";
    }

    setRefreshing((prev) => ({ ...prev, [platformName.toLowerCase()]: true }));
    try {
      await api.get(`/platform/${key}/refresh`);
      onUpdate();
      showToast("success", "Refreshed", `${platformName} profile updated`);
    } catch (error) {
      console.error(`Failed to refresh ${platformName}`, error);
      showToast("error", "Refresh Failed", "Could not sync profile data");
    } finally {
      setRefreshing((prev) => ({ ...prev, [platformName.toLowerCase()]: false }));
    }
  };

  const getProfileUrl = (platform: string, handle?: string, platformId?: string) => {
    switch (platform) {
      case "Bluesky":
        return handle ? `https://bsky.app/profile/${handle}` : "#";
      case "Mastodon":
        return handle ? `https://mastodon.social/@${handle}` : "#";
      case "Tumblr":
        return handle ? `https://tumblr.com/${handle}` : "#";
      case "Facebook":
        return handle
          ? `https://facebook.com/${handle}`
          : platformId
            ? `https://facebook.com/${platformId}`
            : "#";
      case "Instagram":
        return handle
          ? `https://instagram.com/${handle}`
          : platformId
            ? `https://instagram.com/${platformId}`
            : "#";
      case "Threads":
        return handle ? `https://www.threads.net/@${handle}` : "#";
      default:
        return "#";
    }
  };

  const handleDisconnectConfirm = async () => {
    if (!platformToDelete) return;

    try {
      const endpoint =
        platformToDelete.key === "bluesky"
          ? "/platform/bluesky/disconnect"
          : `/platform/${platformToDelete.key}/disconnect`;
      await api.delete(endpoint);
      showToast("success", "Disconnected", `${platformToDelete.name} disconnected successfully`);
      onUpdate();
    } catch (error) {
      console.error(`Failed to disconnect ${platformToDelete.name}`, error);
      showToast(
        "error",
        "Disconnect Failed",
        `Could not disconnect ${platformToDelete.name}. Please try again.`,
      );
    } finally {
      setIsDisconnectAlertOpen(false);
      setPlatformToDelete(null);
    }
  };

  const handleTumblrConnect = () => {
    api
      .get<{ data: { authUrl: string } }>("/platform/tumblr/connect")
      .then((res) => {
        const backendUrl = res.data.data.authUrl;
        console.log(backendUrl);
        window.location.href = backendUrl;
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleTumblrDisconnect = async () => {
    try {
      await api.delete("/platform/tumblr/disconnect");
      showToast("success", "Disconnected", "Tumblr account disconnected successfully");
      onUpdate();
    } catch (error) {
      console.error("Failed to disconnect Tumblr", error);
      showToast("error", "Disconnect Failed", "Could not disconnect Tumblr. Please try again.");
    }
  };

  const platformIcons = {
    Threads: (
      <svg viewBox="0 0 192 192" className="w-5 h-5 fill-white">
        <path d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.022 87.8451C137.535 83.8954 135.488 80.1552 132.921 76.7412C128.433 70.9382 122.315 65.9706 115.072 62.9375C108.305 60.015 100.963 58.8052 93.6339 58.8052C87.6563 58.8052 81.6583 59.9815 76.1086 62.4309C69.0461 65.4187 63.3533 70.2185 59.1554 76.0129C54.7649 82.2886 52.4168 89.8786 52.4168 97.4361C52.4168 105.955 55.4243 113.805 60.8932 120.257C66.1848 126.312 73.6655 130.413 81.4927 131.78C82.4935 131.956 83.513 132.062 84.5369 132.062C87.4291 132.062 90.3122 131.432 93.0031 130.122C99.432 127.18 102.586 120.735 102.586 120.735L102.666 120.597C105.021 123.637 107.828 126.315 111.021 128.532C111.666 128.981 112.333 129.406 113.013 129.816C117.803 132.936 123.153 134.73 128.694 134.73C139.462 134.73 148.513 128.718 152.029 119.006C153.287 115.532 153.754 111.83 153.754 108.086C153.754 84.7236 137.962 67.9251 113.053 58.0709C107.034 55.6989 100.672 54.4828 94.218 54.4828C86.7368 54.4828 79.2555 55.9526 72.3168 59.0142C63.4883 62.7483 56.3718 68.7491 51.1219 75.9926C45.6331 83.8379 42.6974 93.3267 42.6974 102.775C42.6974 113.42 46.4578 123.23 53.2963 130.822C59.9109 138.397 69.2618 143.522 79.0436 145.234C81.166 145.584 83.2429 145.747 85.2536 145.747C89.5539 145.747 93.8443 144.974 97.9735 143.344C107.729 139.529 115.247 131.792 119.566 123.08C120.306 125.791 121.579 128.322 123.297 130.551C121.734 132.067 120.063 133.473 118.297 134.757C118.17 134.848 118.04 134.939 117.91 135.034C114.733 137.241 111.411 139.206 107.977 140.893C100.742 144.526 92.8361 146.438 84.6666 146.438C71.3695 146.438 58.1132 141.282 48.068 131.787C39.6976 124.085 34.6121 113.432 34.6121 101.839C34.6121 89.2847 38.6493 77.2941 46.2845 67.2483C53.3039 57.5684 62.8184 49.5446 74.6186 44.5501C83.8967 40.4573 93.9056 38.4925 103.903 38.4925C113.434 38.4925 122.92 40.292 131.909 43.8485C146.212 49.507 155.281 59.1554 155.281 72.5654C155.281 75.2152 154.912 77.8543 154.212 80.4444C154.129 80.7583 154.041 81.0664 153.948 81.3745C152.094 87.7958 147.16 113.161 127.272 123.68C127.184 123.726 127.094 123.774 127.009 123.816C126.984 123.822 126.96 123.834 126.937 123.844C126.49 124.053 126.037 124.254 125.578 124.444C125.864 124.326 126.151 124.204 126.439 124.075C124.425 125.011 122.257 125.626 120.022 125.842C116.745 126.155 113.524 125.467 110.654 123.899C107.016 121.91 104.755 117.95 104.755 113.527C104.755 110.038 106.126 106.883 108.406 104.582C111.401 101.528 116.096 99.854 121.286 99.854C124.717 99.854 127.868 100.672 130.643 102.218C132.887 103.467 134.782 105.182 136.217 107.258C136.438 106.636 136.631 106.002 136.793 105.358C137.915 100.835 137.564 94.7533 133.092 90.7247C130.124 88.0494 126.012 86.8407 120.871 87.1328C114.735 87.4981 109.916 90.0752 106.541 94.7931C103.967 98.3976 102.661 103.047 102.661 108.613C102.661 110.607 102.821 112.564 103.136 114.471C103.693 118.077 105.048 121.493 107.411 124.298C107.576 124.493 107.749 124.685 107.925 124.872C107.607 124.704 107.291 124.529 106.979 124.346C104.14 122.68 102.049 120.372 100.741 117.652C99.6385 115.352 99.0792 112.87 99.0792 110.283C99.0792 102.438 101.996 95.8454 107.284 91.6033C113.256 86.8049 121.841 85.034 131.503 86.6062C133.911 87.0099 136.264 87.6973 138.514 88.6362C139.531 89.0526 140.522 89.5168 141.487 90.0248C141.516 89.6738 141.537 89.3302 141.537 88.9883ZM122.463 121.294C121.319 121.365 120.245 121.233 119.349 120.887C118.026 120.441 116.969 119.664 116.205 118.572C115.155 117.069 114.639 115.244 114.639 113.013C114.639 108.777 117.063 105.733 121.144 105.733C122.844 105.733 124.356 106.273 125.503 107.291C126.985 108.608 127.8 110.603 127.8 112.913C127.8 117.519 125.864 121.082 122.463 121.294Z" />
      </svg>
    ),
    Bluesky: (
      <svg viewBox="0 0 512 462" className="w-5 h-5 fill-white">
        <path d="M111.8 69.3C155.6 42.1 198.8 38.2 256 129.8c57.2-91.6 100.4-87.7 144.2-60.5C453.7 99.8 459 231.5 407.9 292.8c-10.4 12.5-30 20.2-46.6 23.3 32.1 8 67 22.8 54.3 75.6-7.4 30.7-56.1 48-111.3 27-28-10.7-48.4-23.7-48.4-23.7s-20.3 13-48.4 23.7c-55.2 21-103.9 3.7-111.3-27-12.7-52.8 22.2-67.6 54.3-75.6-16.7-3.1-36.2-10.8-46.6-23.3C52.9 231.5 58.3 99.8 111.8 69.3z" />
      </svg>
    ),
    Mastodon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 511.476" className="w-5 h-5">
        <defs>
          <linearGradient
            id="mastodon-gradient"
            gradientUnits="userSpaceOnUse"
            x1="235.378"
            y1=".003"
            x2="235.378"
            y2="506.951"
          >
            <stop offset="0" stopColor="#6364FF" />
            <stop offset="1" stopColor="#563ACC" />
          </linearGradient>
        </defs>
        <g fillRule="nonzero">
          <path
            fill="url(#mastodon-gradient)"
            d="M478.064 113.237c-7.393-54.954-55.29-98.266-112.071-106.656C356.413 5.163 320.121 0 236.045 0h-.628c-84.1 0-102.141 5.163-111.72 6.581C68.498 14.739 18.088 53.655 5.859 109.261c-5.883 27.385-6.51 57.747-5.416 85.596 1.555 39.939 1.859 79.806 5.487 119.581a562.694 562.694 0 0013.089 78.437c11.625 47.654 58.687 87.313 104.793 103.494a281.073 281.073 0 00153.316 8.09 224.345 224.345 0 0016.577-4.533c12.369-3.928 26.856-8.321 37.506-16.042.146-.107.265-.247.348-.407.086-.161.134-.339.14-.521v-38.543a1.187 1.187 0 00-.119-.491 1.122 1.122 0 00-.773-.604 1.139 1.139 0 00-.503 0 424.932 424.932 0 01-99.491 11.626c-57.664 0-73.171-27.361-77.611-38.752a120.09 120.09 0 01-6.745-30.546 1.123 1.123 0 01.877-1.152c.173-.035.349-.032.518.012a416.876 416.876 0 0097.864 11.623c7.929 0 15.834 0 23.763-.211 33.155-.928 68.103-2.626 100.722-8.997.815-.16 1.63-.3 2.326-.508 51.454-9.883 100.422-40.894 105.397-119.42.185-3.093.651-32.385.651-35.591.022-10.903 3.51-77.343-.511-118.165z"
          />
          <path
            fill="#fff"
            d="M396.545 174.981v136.53h-54.104V179.002c0-27.896-11.625-42.124-35.272-42.124-25.996 0-39.017 16.833-39.017 50.074v72.531h-53.777v-72.531c0-33.241-13.044-50.074-39.04-50.074-23.507 0-35.248 14.228-35.248 42.124v132.509H86.006v-136.53c0-27.896 7.123-50.059 21.366-66.488 14.695-16.387 33.97-24.803 57.896-24.803 27.691 0 48.617 10.647 62.568 31.917l13.464 22.597 13.484-22.597c13.951-21.27 34.877-31.917 62.521-31.917 23.902 0 43.177 8.416 57.919 24.803 14.231 16.414 21.336 38.577 21.321 66.488z"
          />
        </g>
      </svg>
    ),
    Tumblr: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" className="w-5 h-5">
        <path
          d="M 40 0 L 10 0 C 4.484375 0 0 4.484375 0 10 L 0 40 C 0 45.515625 4.484375 50 10 50 L 40 50 C 45.515625 50 50 45.515625 50 40 L 50 10 C 50 4.484375 45.515625 0 40 0 Z M 34 40.238281 C 34 40.363281 33.945313 40.480469 33.855469 40.5625 C 33.738281 40.664063 31.011719 43 24.742188 43 C 17.230469 43 17 34.617188 17 33.664063 L 17 23.011719 L 13.429688 23 C 13.191406 23 13 22.816406 13 22.578125 L 13 18.808594 C 13 18.632813 13.109375 18.472656 13.273438 18.40625 C 13.34375 18.382813 20.058594 15.773438 20.058594 9.429688 C 20.058594 9.191406 20.253906 9 20.492188 9 L 24.578125 9 C 24.816406 9 25.007813 9.191406 25.007813 9.429688 L 25 17 L 31.5625 17 C 31.800781 17 31.992188 17.207031 31.992188 17.445313 L 31.992188 22.554688 C 31.992188 22.789063 31.800781 23 31.5625 23 L 25 23 C 25 23 25 33.253906 25 33.503906 C 25 33.75 25.226563 36.765625 28.433594 36.765625 C 31.089844 36.765625 33.320313 35.398438 33.34375 35.382813 C 33.476563 35.296875 33.640625 35.292969 33.777344 35.371094 C 33.914063 35.445313 34 35.589844 34 35.746094 Z"
          fill="#fff"
        />
      </svg>
    ),
    Instagram: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-white stroke-2">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
    Facebook: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  };

  const getExpiryStatus = (expiresAt?: Date | string) => {
    if (!expiresAt) return null;
    const daysLeft = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysLeft < 0) return { label: "Expired", color: "text-red-600", urgent: true };
    if (daysLeft <= 7)
      return { label: `Expires in ${daysLeft} days`, color: "text-amber-600", urgent: true };
    return { label: `Expires in ${daysLeft} days`, color: "text-gray-400", urgent: false };
  };

  const renderPlatformActions = (platform: PlatformInfo) => {
    const expiry = platform.expiresAt ? getExpiryStatus(platform.expiresAt) : null;
    const isMeta = ["Facebook", "Instagram", "Threads"].includes(platform.name);

    if (platform.status === "connected") {
      return (
        <div className="flex items-center gap-2">
          {expiry && (
            <span className={`text-[10px] font-medium mr-1 ${expiry.color}`}>{expiry.label}</span>
          )}

          <button
            onClick={() => handleRefresh(platform.name)}
            disabled={refreshing[platform.name.toLowerCase()]}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Refresh Profile"
          >
            <RefreshCw
              size={16}
              className={cn(refreshing[platform.name.toLowerCase()] ? "animate-spin" : "")}
            />
          </button>

          <a
            href={getProfileUrl(platform.name, platform.handle, platform.platformId)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Visit Profile"
          >
            <ExternalLink size={16} />
          </a>

          {isMeta && expiry?.urgent && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const endpoint =
                    platform.name === "Facebook" || platform.name === "Instagram"
                      ? "/platform/facebook/connect"
                      : "/platform/threads/connect";
                  const res = await api.get(endpoint);
                  if (res.data?.data?.url) window.location.href = res.data.data.url;
                } catch (e) {
                  console.error(e);
                }
              }}
              className="rounded-full px-4 h-8 text-[11px] font-medium border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            >
              Reconnect
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => {
              if (platform.name === "Tumblr") {
                setIsTumblrDisconnectAlertOpen(true);
              } else {
                setPlatformToDelete({
                  name: isMeta
                    ? platform.name === "Threads"
                      ? "Threads"
                      : "Facebook & Instagram"
                    : platform.name,
                  key: isMeta
                    ? platform.name === "Threads"
                      ? "threads"
                      : "facebook"
                    : (platform.name.toLowerCase() as "bluesky" | "mastodon"),
                });
                setIsDisconnectAlertOpen(true);
              }
            }}
            className="rounded-full px-4 h-8 text-[11px] font-medium border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300"
          >
            Disconnect
          </Button>
        </div>
      );
    }

    return (
      <Button
        variant="outline"
        onClick={async () => {
          if (isMeta) {
            try {
              const endpoint =
                platform.name === "Facebook" || platform.name === "Instagram"
                  ? "/platform/facebook/connect"
                  : "/platform/threads/connect";
              const res = await api.get<{ data: { url: string } }>(endpoint);
              if (res.data?.data?.url) window.location.href = res.data.data.url;
            } catch {
              showToast("error", "Error", "Could not initiate connection");
            }
          } else {
            if (platform.name === "Bluesky") setIsBlueskyModalOpen(true);
            else if (platform.name === "Tumblr") handleTumblrConnect();
            else if (platform.name === "Mastodon") setIsMastodonConnectAlertOpen(true);
          }
        }}
        className="rounded-full px-5 h-9 text-xs font-medium border transition-colors bg-[#318D62] text-white hover:bg-[#287350] border-transparent"
      >
        Connect
      </Button>
    );
  };

  const platforms: PlatformInfo[] = [
    {
      name: "Threads",
      status:
        connectedPlatforms?.threads?.connected && connectedPlatforms?.threads?.platformId
          ? "connected"
          : "disconnected",
      color: "bg-black",
      icon: platformIcons.Threads,
      userAvatar: connectedPlatforms?.threads?.profile?.avatar,
      displayName: connectedPlatforms?.threads?.profile?.displayName,
      handle: connectedPlatforms?.threads?.profile?.handle,
      platformId: connectedPlatforms?.threads?.platformId,
      expiresAt: connectedPlatforms?.threads?.auth?.expiresAt,
    },
    {
      name: "Bluesky",
      status: connectedPlatforms?.bluesky?.connected ? "connected" : "disconnected",
      color: "bg-blue-500",
      icon: platformIcons.Bluesky,
      userAvatar: connectedPlatforms?.bluesky?.profile?.avatar,
      displayName: connectedPlatforms?.bluesky?.profile?.displayName,
      handle: connectedPlatforms?.bluesky?.handle,
      platformId: connectedPlatforms?.bluesky?.did,
    },
    {
      name: "Mastodon",
      status: connectedPlatforms?.mastodon?.connected ? "connected" : "disconnected",
      color: "bg-purple-600",
      icon: platformIcons.Mastodon,
      userAvatar: connectedPlatforms?.mastodon?.profile?.avatar,
      displayName: connectedPlatforms?.mastodon?.profile?.displayName,
      handle: connectedPlatforms?.mastodon?.profile?.handle,
      platformId: connectedPlatforms?.mastodon?.accountId,
    },
    {
      name: "Tumblr",
      status: connectedPlatforms?.tumblr?.connected ? "connected" : "disconnected",
      color: "bg-blue-900",
      icon: platformIcons.Tumblr,
      userAvatar: connectedPlatforms?.tumblr?.profile?.avatar,
      displayName: connectedPlatforms?.tumblr?.profile?.displayName,
      handle: connectedPlatforms?.tumblr?.profile?.handle,
    },
    {
      name: "Instagram",
      status:
        connectedPlatforms?.instagram?.connected && connectedPlatforms?.instagram?.platformId
          ? "connected"
          : "disconnected",
      color: "bg-pink-600",
      icon: platformIcons.Instagram,
      userAvatar: connectedPlatforms?.instagram?.profile?.avatar,
      displayName: connectedPlatforms?.instagram?.profile?.displayName,
      handle: connectedPlatforms?.instagram?.profile?.handle,
      platformId: connectedPlatforms?.instagram?.platformId,
      expiresAt: connectedPlatforms?.instagram?.auth?.expiresAt,
    },
    {
      name: "Facebook",
      status:
        connectedPlatforms?.facebook?.connected && connectedPlatforms?.facebook?.platformId
          ? "connected"
          : "disconnected",
      color: "bg-blue-600",
      icon: platformIcons.Facebook,
      userAvatar: connectedPlatforms?.facebook?.profile?.avatar,
      displayName: connectedPlatforms?.facebook?.profile?.displayName,
      handle: connectedPlatforms?.facebook?.profile?.handle,
      platformId: connectedPlatforms?.facebook?.platformId,
      expiresAt: connectedPlatforms?.facebook?.auth?.expiresAt,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 lg:p-8 h-3/4">
      <div className="flex items-center gap-2 mb-8">
        <h3 className="text-lg font-bold text-gray-900">Connect to platforms</h3>
        <button
          onClick={() => setIsTutorialOpen(true)}
          className="text-gray-400 hover:text-blue-600 transition-colors pointer-events-auto"
          title="How to connect?"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      <div className="space-y-6">
        {platforms.map((platform) => (
          <div key={platform.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full ${platform.color} flex items-center justify-center text-white shadow-sm shrink-0`}
              >
                {platform.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-base font-medium text-gray-900 leading-tight">
                  {platform.status === "connected"
                    ? platform.displayName || (platform.handle ? platform.handle : platform.name)
                    : platform.name}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                  {platform.status === "connected" && platform.userAvatar && (
                    <div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-200 shrink-0 shadow-sm">
                      <Image
                        src={platform.userAvatar}
                        alt={platform.displayName || platform.handle || "Avatar"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <span className="text-xs font-medium text-gray-500">
                    {platform.status === "connected" ? platform.name : "Not connected"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">{renderPlatformActions(platform)}</div>
          </div>
        ))}
      </div>

      <BlueskyConnectModal
        isOpen={isBlueskyModalOpen}
        onClose={() => setIsBlueskyModalOpen(false)}
        onSuccess={() => onUpdate()}
      />

      <AlertDialog open={isDisconnectAlertOpen} onOpenChange={setIsDisconnectAlertOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {platformToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect your {platformToDelete?.name} account? This will
              stop all automated posts and tracking for this platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnectConfirm}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isMastodonConnectAlertOpen} onOpenChange={setIsMastodonConnectAlertOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Connect to Mastodon</AlertDialogTitle>
            <AlertDialogDescription>
              Currently, we only support connections to the <strong>mastodon.social</strong>{" "}
              instance. Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                api
                  .get("/platform/mastodon/connect")
                  .then((res) => {
                    if (res.data.data.authUrl) window.location.href = res.data.data.authUrl;
                  })
                  .catch((err) => console.error(err));
              }}
              className="rounded-full bg-[#563ACC] hover:bg-[#452d9a] text-white"
            >
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isTumblrDisconnectAlertOpen} onOpenChange={setIsTumblrDisconnectAlertOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Tumblr?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect your Tumblr account? This will stop all automated
              posts and tracking for this platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTumblrDisconnect}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ConnectionTutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </div>
  );
};
