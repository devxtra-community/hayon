import { User } from "@/types/create-post";
import { SocialAccount } from "@hayon/schemas";

export const usePlatformUser = (user: User | null, connectedAccounts: SocialAccount | null) => {
  const getPlatformUser = (pid: string): User | null => {
    if (!user) return null;
    if (!connectedAccounts) return user;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let profile: any = null;
    let platformHandle = "";

    switch (pid) {
      case "facebook":
        if (connectedAccounts.facebook?.connected) {
          profile = connectedAccounts.facebook.profile;
          platformHandle = profile?.name;
        }
        break;
      case "instagram":
        if (connectedAccounts.instagram?.connected) {
          profile = connectedAccounts.instagram.profile;
          platformHandle = profile?.username || profile?.handle;
        }
        break;
      case "threads":
        if (connectedAccounts.threads?.connected) {
          profile = connectedAccounts.threads.profile;
          platformHandle = profile?.username || profile?.handle;
        }
        break;
      case "bluesky":
        if (connectedAccounts.bluesky?.connected) {
          profile = connectedAccounts.bluesky.profile;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          platformHandle = (connectedAccounts.bluesky as any).handle || profile?.handle;
        }
        break;
      case "mastodon":
        if (connectedAccounts.mastodon?.connected) {
          profile = connectedAccounts.mastodon.profile;
          platformHandle = profile?.username || profile?.handle;
        }
        break;
      case "tumblr":
        if (connectedAccounts.tumblr?.connected) {
          profile = connectedAccounts.tumblr.profile;
          platformHandle = profile?.name || profile?.handle;
        }
        break;
    }

    if (profile || platformHandle) {
      const displayName = profile?.displayName || profile?.name || platformHandle || user.name;
      return {
        ...user,
        name: displayName,
        avatar: profile?.avatar || user.avatar,
        email: platformHandle || user.email,
      };
    }

    return user;
  };

  return { getPlatformUser };
};
