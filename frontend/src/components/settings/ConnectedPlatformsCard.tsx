"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { SocialAccount } from "../../../../backend/src/interfaces/socialAccount.interface";

interface ConnectedPlatformsCardProps {
  connectedPlatforms: SocialAccount | null;
  onUpdate: () => void;
}

export const ConnectedPlatformsCard: React.FC<ConnectedPlatformsCardProps> = ({
  connectedPlatforms,
  onUpdate,
}) => {
  const [isBlueskyModalOpen, setIsBlueskyModalOpen] = useState(false);
  const [isDisconnectAlertOpen, setIsDisconnectAlertOpen] = useState(false);
  const { showToast } = useToast();

  const handleBlueskyDisconnect = async () => {
    try {
      await api.delete("/platform/bluesky/disconnect");
      showToast("success", "Disconnected", "Bluesky account disconnected successfully");
      onUpdate();
    } catch (error) {
      console.error("Failed to disconnect Bluesky", error);
      showToast("error", "Disconnect Failed", "Could not disconnect Bluesky. Please try again.");
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
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
        <path d="M23.193 11.237c0-2.915-.555-4.606-.555-4.606C21.84 3.737 18.062 3.325 15.34 3.25c-1.802-.05-3.486-.063-5.174-.063-2.025 0-4.045.02-6.07.087-2.723.075-6.502.487-7.297 3.382 0 0-.555 1.691-.555 4.606-.118 6.037 1.05 11.968 6.94 13.111 2.659.516 5.567.575 7.82.072 2.875-.641 3.597-3.027 3.597-3.027l-.022-1.46c-1.571.494-3.454.685-5.266.425-3.085-.443-3.425-2.617-3.444-2.793.003 0 .007 0 .01.002 2.015.545 5.544.759 8.243-.637 1.135-.587 2.179-1.413 2.955-2.298.536-1.558.58-2.67.58-2.67l.006-.01.034-.582zM12.924 16.516h-1.849v-4.347c0-1.166-.46-1.751-1.381-1.751-.99 0-1.57.653-1.57 1.956v2.858H6.28V9.338c0-2.31 1.516-3.483 3.69-3.483 1.589 0 2.37.986 2.868 2.083.498-1.097 1.28-2.083 2.868-2.083 2.174 0 3.69 1.173 3.69 3.483v5.894h-1.844v-2.858c0-1.303-.58-1.956-1.57-1.956-.92 0-1.382.585-1.382 1.751v4.347z" />
      </svg>
    ),
    Tumblr: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
        <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.606-1.319 4.541-4.93 4.697-6.65h3.359v5.93h3.71v4.544h-3.71v3.457c0 1.969 1.188 2.339 2.094 2.339 1.235 0 2.172-.516 2.172-.516v4.61s-1.016.638-2.875.638z" />
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

  const platforms = [
    {
      name: "Threads",
      status:
        connectedPlatforms?.meta?.connected && connectedPlatforms?.meta?.threads?.platformId
          ? "connected"
          : "disconnected",
      color: "bg-black",
      icon: platformIcons.Threads,
      userAvatar: connectedPlatforms?.meta?.threads?.profile?.avatar,
      userName:
        connectedPlatforms?.meta?.threads?.profile?.handle ||
        connectedPlatforms?.meta?.threads?.profile?.displayName,
    },
    {
      name: "Bluesky",
      status: connectedPlatforms?.bluesky?.connected ? "connected" : "disconnected",
      color: "bg-blue-500",
      icon: platformIcons.Bluesky,
      userAvatar: connectedPlatforms?.bluesky?.profile?.avatar,
      userName:
        connectedPlatforms?.bluesky?.profile?.handle ||
        connectedPlatforms?.bluesky?.profile?.displayName,
    },
    {
      name: "Mastodon",
      status: connectedPlatforms?.mastodon?.connected ? "connected" : "disconnected",
      color: "bg-purple-600",
      icon: platformIcons.Mastodon,
      userAvatar: connectedPlatforms?.mastodon?.profile?.avatar,
      userName:
        connectedPlatforms?.mastodon?.profile?.handle ||
        connectedPlatforms?.mastodon?.profile?.displayName,
    },
    {
      name: "Tumblr",
      status: connectedPlatforms?.tumblr?.connected ? "connected" : "disconnected",
      color: "bg-blue-900",
      icon: platformIcons.Tumblr,
      userAvatar: connectedPlatforms?.tumblr?.profile?.avatar,
      userName:
        connectedPlatforms?.tumblr?.profile?.handle ||
        connectedPlatforms?.tumblr?.profile?.displayName,
    },
    {
      name: "Instagram",
      status:
        connectedPlatforms?.meta?.connected && connectedPlatforms?.meta?.instagram?.platformId
          ? "connected"
          : "disconnected",
      color: "bg-pink-600",
      icon: platformIcons.Instagram,
      userAvatar: connectedPlatforms?.meta?.instagram?.profile?.avatar,
      userName:
        connectedPlatforms?.meta?.instagram?.profile?.handle ||
        connectedPlatforms?.meta?.instagram?.profile?.displayName,
    },
    {
      name: "Facebook",
      status:
        connectedPlatforms?.meta?.connected && connectedPlatforms?.meta?.facebook?.platformId
          ? "connected"
          : "disconnected",
      color: "bg-blue-600",
      icon: platformIcons.Facebook,
      userAvatar: connectedPlatforms?.meta?.facebook?.profile?.avatar,
      userName:
        connectedPlatforms?.meta?.facebook?.profile?.handle ||
        connectedPlatforms?.meta?.facebook?.profile?.displayName,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 lg:p-8 h-3/4">
      <h3 className="text-lg font-bold text-gray-900 mb-8">Connect to platforms</h3>

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
                  {platform.name}
                </span>
                {platform.status === "connected" && (
                  <div className="flex items-center gap-2 mt-1.5">
                    {platform.userAvatar && (
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200 shrink-0 shadow-sm">
                        <img
                          src={platform.userAvatar}
                          alt={platform.userName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <span className="text-xs font-medium text-gray-600">
                      {platform.userName ? `@${platform.userName}` : "Connected"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {platform.name === "Bluesky" && platform.status === "connected" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsBlueskyModalOpen(true)}
                    className="rounded-full px-4 h-8 text-[11px] font-medium border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    Reconnect
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsDisconnectAlertOpen(true)}
                    className="rounded-full px-4 h-8 text-[11px] font-medium border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300"
                  >
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (platform.name === "Bluesky" && platform.status === "disconnected") {
                      setIsBlueskyModalOpen(true);
                    }
                  }}
                  className={`rounded-full px-5 h-9 text-xs font-medium border transition-colors ${
                    platform.status === "connected"
                      ? "bg-white border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                      : "bg-[#318D62] text-white hover:bg-[#287350] border-transparent"
                  }`}
                >
                  {platform.status === "connected" ? "Disconnect" : "Connect"}
                </Button>
              )}
            </div>
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
            <AlertDialogTitle>Disconnect Bluesky?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect your Bluesky account? This will stop all automated
              posts and tracking for this platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full border-gray-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlueskyDisconnect}
              className="rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
    