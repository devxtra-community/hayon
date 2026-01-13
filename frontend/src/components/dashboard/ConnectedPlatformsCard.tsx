"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, HelpCircle, ExternalLink, RefreshCw } from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/axios";
import { SocialAccount } from "@hayon/schemas";
import { ConnectionTutorialModal } from "@/components/settings/ConnectionTutorialModal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConnectedAccount {
  platform: string;
  displayName?: string;
  handle?: string;
  platformId?: string;
  avatar?: string;
  expiresAt?: Date | string;
}

export default function ConnectedPlatformsCard() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<SocialAccount | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [refreshing, setRefreshing] = useState<Record<string, boolean>>({});

  const fetchPlatforms = async () => {
    try {
      const { data } = await api.get("/platform/find");
      setConnectedPlatforms(data.data);
    } catch (error) {
      console.error("Failed to fetch connected accounts", error);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleRefresh = async (platformName: string) => {
    let key = platformName.toLowerCase();
    // Facebook and Instagram share the same refresh endpoint in our implementation
    if (key === "instagram" || key === "facebook") {
      key = "facebook";
    }

    setRefreshing((prev) => ({ ...prev, [platformName.toLowerCase()]: true }));
    try {
      await api.get(`/platform/${key}/refresh`);
      await fetchPlatforms();
    } catch (error) {
      console.error(`Failed to refresh ${platformName}`, error);
    } finally {
      setRefreshing((prev) => ({ ...prev, [platformName.toLowerCase()]: false }));
    }
  };

  const getProfileUrl = (account: ConnectedAccount) => {
    const { platform, handle, platformId } = account;

    switch (platform) {
      case "Bluesky":
        return handle ? `https://bsky.app/profile/${handle}` : "#";
      case "Mastodon":
        return handle ? `https://mastodon.social/@${handle}` : "#"; // Assuming mastodon.social for now
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

  const getConnectedList = (): ConnectedAccount[] => {
    if (!connectedPlatforms) return [];

    const list = [];
    if (connectedPlatforms.facebook?.connected && connectedPlatforms.facebook?.platformId) {
      list.push({
        platform: "Facebook",
        ...connectedPlatforms.facebook.profile,
        platformId: connectedPlatforms.facebook.platformId,
        handle: connectedPlatforms.facebook.profile?.handle,
      });
    }
    if (connectedPlatforms.instagram?.connected && connectedPlatforms.instagram?.platformId) {
      list.push({
        platform: "Instagram",
        ...connectedPlatforms.instagram.profile,
        platformId: connectedPlatforms.instagram.platformId,
      });
    }
    if (connectedPlatforms.threads?.connected && connectedPlatforms.threads?.platformId) {
      list.push({
        platform: "Threads",
        ...connectedPlatforms.threads.profile,
        platformId: connectedPlatforms.threads.platformId,
      });
    }
    if (connectedPlatforms.mastodon?.connected) {
      list.push({ platform: "Mastodon", ...connectedPlatforms.mastodon.profile });
    }
    if (connectedPlatforms.bluesky?.connected) {
      const profile = connectedPlatforms.bluesky.profile || {};
      list.push({
        platform: "Bluesky",
        ...profile,
        handle: connectedPlatforms.bluesky.handle || profile.handle,
      });
    }
    if (connectedPlatforms.tumblr?.connected) {
      list.push({ platform: "Tumblr", ...connectedPlatforms.tumblr.profile });
    }
    return list;
  };

  const connectedList = getConnectedList();

  return (
    <div className="bg-white rounded-2xl p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-medium text-gray-900">Connected Accounts</h3>
          <button
            onClick={() => setIsTutorialOpen(true)}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="How to connect?"
          >
            <HelpCircle size={16} />
          </button>
        </div>
        <Link
          href="/settings"
          className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowUpRight size={16} className="text-gray-500" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center min-h-[140px]">
        {connectedList.length > 0 ? (
          <div className="space-y-4">
            {connectedList.map((account, i) => (
              <div
                key={`${account.platform}-${i}`}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 shadow-sm transition-transform group-hover:scale-105">
                    {account.avatar ? (
                      <Image
                        src={account.avatar}
                        alt={account.platform}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-500">{account.platform[0]}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate block">
                      {account.displayName || (account.handle ? account.handle : account.platform)}
                    </span>
                    <span className="text-xs text-gray-500 truncate block">{account.platform}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRefresh(account.platform)}
                    disabled={refreshing[account.platform.toLowerCase()]}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Refresh Profile"
                  >
                    <RefreshCw
                      size={14}
                      className={cn(
                        refreshing[account.platform.toLowerCase()] ? "animate-spin" : "",
                      )}
                    />
                  </button>
                  <a
                    href={getProfileUrl(account)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Visit Profile"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-4">
            <p className="text-sm text-gray-500 mb-4">No accounts connected yet.</p>
            <Link href="/settings">
              <Button
                size="sm"
                className="bg-[#318D62] hover:bg-[#287350] text-white rounded-full px-6"
              >
                Connect Now
              </Button>
            </Link>
          </div>
        )}
      </div>

      <ConnectionTutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </div>
  );
}
