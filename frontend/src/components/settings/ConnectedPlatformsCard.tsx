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
    Threads: <Image src="/images/logos/threads.png" alt="Threads" fill className="object-cover" />,
    Bluesky: <Image src="/images/logos/bluesky.png" alt="Bluesky" fill className="object-cover" />,
    Mastodon: (
      <Image src="/images/logos/mastodon.png" alt="Mastodon" fill className="object-cover" />
    ),
    Tumblr: <Image src="/images/logos/tumblr.png" alt="Tumblr" fill className="object-cover" />,
    Instagram: (
      <Image src="/images/logos/instagram.png" alt="Instagram" fill className="object-cover" />
    ),
    Facebook: (
      <Image src="/images/logos/facebook.png" alt="Facebook" fill className="object-cover" />
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
      color: "bg-white border border-gray-100",
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
      color: "bg-white border border-gray-100",
      icon: platformIcons.Bluesky,
      userAvatar: connectedPlatforms?.bluesky?.profile?.avatar,
      displayName: connectedPlatforms?.bluesky?.profile?.displayName,
      handle: connectedPlatforms?.bluesky?.handle,
      platformId: connectedPlatforms?.bluesky?.did,
    },
    {
      name: "Mastodon",
      status: connectedPlatforms?.mastodon?.connected ? "connected" : "disconnected",
      color: "bg-white border border-gray-100",
      icon: platformIcons.Mastodon,
      userAvatar: connectedPlatforms?.mastodon?.profile?.avatar,
      displayName: connectedPlatforms?.mastodon?.profile?.displayName,
      handle: connectedPlatforms?.mastodon?.profile?.handle,
      platformId: connectedPlatforms?.mastodon?.accountId,
    },
    {
      name: "Tumblr",
      status: connectedPlatforms?.tumblr?.connected ? "connected" : "disconnected",
      color: "bg-white border border-gray-100",
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
              <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm shrink-0">
                {platform.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-base font-medium text-gray-900 leading-tight">
                  {platform.name}
                </span>
                <div className="flex items-center gap-2 mt-1.5 min-w-0">
                  {platform.status === "connected" ? (
                    <>
                      {platform.userAvatar && (
                        <div className="relative w-4 h-4 rounded-full overflow-hidden border border-gray-100 shrink-0 shadow-sm">
                          <Image
                            src={platform.userAvatar}
                            alt={platform.displayName || platform.handle || "Avatar"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <span className="text-xs font-medium text-gray-500 truncate">
                        {platform.displayName || platform.handle}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-medium text-gray-400">Not connected</span>
                  )}
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
