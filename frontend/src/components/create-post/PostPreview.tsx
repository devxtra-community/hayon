import {
  MessageCircle,
  Repeat,
  Heart,
  MoreHorizontal,
  Share,
  ArrowLeft,
  Calendar,
  Send,
  Image as ImageIcon,
  Globe,
  Clock,
  ThumbsUp,
  Bookmark,
  Star,
  Reply,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Platform, User } from "@/types/create-post";
import { TumblrPreview } from "./TumblrPreview";
import { SocialAccount } from "@hayon/schemas";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface PostPreviewProps {
  user: User | null;
  postText: string;
  filePreviews: string[];
  availablePlatforms: Platform[];
  selectedPlatforms: string[];
  onBack: () => void;
  onPostNow: () => void;
  isScheduleOpen: boolean;
  setIsScheduleOpen: (open: boolean) => void;
  scheduleDate: string;
  setScheduleDate: (date: string) => void;
  scheduleTime: string;
  setScheduleTime: (time: string) => void;
  handleScheduleConfirm: () => void;
  timeZone: string;
  connectedAccounts: SocialAccount | null;
}

// --- Specific Previews ---

const FacebookPreview = ({
  user,
  postText,
  filePreviews,
}: {
  user: User | null;
  postText: string;
  filePreviews: string[];
}) => (
  <div className="bg-white text-[#050505] rounded-xl shadow-sm border border-gray-200 max-w-xl mx-auto w-full font-sans overflow-hidden">
    {/* Header */}
    <div className="p-3 flex items-start justify-between">
      <div className="flex gap-2">
        <div className="w-10 h-10 rounded-full relative overflow-hidden bg-gray-100 border border-gray-100">
          {user?.avatar ? (
            <Image src={user.avatar} alt={user.name || "User"} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>
        <div className="flex flex-col justify-center">
          <span className="font-semibold text-[15px] leading-5 text-[#050505]">
            {user?.name || "Facebook User"}
          </span>
          <div className="flex items-center text-gray-500 text-[13px] leading-4 gap-1">
            <span>Just now</span>
            <span>·</span>
            <Globe size={12} />
          </div>
        </div>
      </div>
      <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors text-gray-600">
        <MoreHorizontal size={20} />
      </div>
    </div>

    {/* Content */}
    <div>
      {postText && (
        <p className="px-3 pb-3 text-[15px] leading-normal whitespace-pre-wrap text-[#050505]">
          {postText}
        </p>
      )}
      {filePreviews.length > 0 && (
        <div className="w-full border-t border-b border-gray-100 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={filePreviews[0]}
            alt="Post"
            className="w-full h-auto max-h-[600px] object-contain mx-auto"
          />
        </div>
      )}
    </div>

    {/* Footer */}
    <div className="px-4 py-2">
      <div className="flex justify-between text-[13px] text-gray-500 mb-2">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <ThumbsUp size={10} className="text-white fill-white" />
          </div>
          <span>1.2K</span>
        </div>
        <div className="flex gap-3">
          <span>45 comments</span>
          <span>12 shares</span>
        </div>
      </div>
      <div className="border-t border-gray-200 flex items-center justify-between py-1">
        <button className="flex-1 flex items-center justify-center gap-2 h-9 rounded-md hover:bg-gray-100 text-gray-600 font-medium text-[15px] transition-colors">
          <ThumbsUp size={18} />
          <span>Like</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 h-9 rounded-md hover:bg-gray-100 text-gray-600 font-medium text-[15px] transition-colors">
          <MessageCircle size={18} />
          <span>Comment</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 h-9 rounded-md hover:bg-gray-100 text-gray-600 font-medium text-[15px] transition-colors">
          <Share size={18} />
          <span>Share</span>
        </button>
      </div>
    </div>
  </div>
);

const InstagramPreview = ({
  user,
  postText,
  filePreviews,
}: {
  user: User | null;
  postText: string;
  filePreviews: string[];
}) => (
  <div className="bg-white text-black rounded-sm border border-gray-200 max-w-xl mx-auto w-full font-sans overflow-hidden">
    {/* Header */}
    <div className="p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500">
          <div className="w-full h-full rounded-full border-2 border-white bg-white relative overflow-hidden">
            {user?.avatar ? (
              <Image src={user.avatar} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-200" />
            )}
          </div>
        </div>
        <span className="font-semibold text-sm">{user?.name || "instagram_user"}</span>
      </div>
      <MoreHorizontal size={20} className="text-gray-600" />
    </div>

    {/* Image Content */}
    {/* Image Content */}
    <div className="w-full bg-gray-50 border-t border-b border-gray-100">
      {filePreviews.length > 0 ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={filePreviews[0]}
          alt="Post"
          className="w-full h-auto max-h-[650px] object-contain mx-auto"
        />
      ) : (
        <div className="w-full aspect-square flex items-center justify-center text-gray-300">
          <ImageIcon size={48} />
        </div>
      )}
    </div>

    {/* Action Bar */}
    <div className="px-3 pt-3 pb-2 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Heart size={24} className="cursor-pointer hover:text-gray-600 transition-colors" />
        <MessageCircle
          size={24}
          className="cursor-pointer hover:text-gray-600 transition-colors -rotate-90"
        />
        <Send size={24} className="cursor-pointer hover:text-gray-600 transition-colors" />
      </div>
      <Bookmark size={24} className="cursor-pointer hover:text-gray-600 transition-colors" />
    </div>

    {/* Caption Area */}
    <div className="px-3 pb-3">
      <div className="font-semibold text-sm mb-1">1,234 likes</div>
      {postText && (
        <div className="text-sm">
          <span className="font-semibold mr-2">{user?.name || "instagram_user"}</span>
          <span className="text-gray-900 whitespace-pre-wrap">{postText}</span>
        </div>
      )}
      <div className="text-[10px] text-gray-400 font-medium mt-2 uppercase tracking-wide">
        Just now
      </div>
    </div>
  </div>
);

const ThreadsPreview = ({
  user,
  postText,
  filePreviews,
}: {
  user: User | null;
  postText: string;
  filePreviews: string[];
}) => (
  <div className="bg-white text-black rounded-xl border border-gray-200 p-4 max-w-xl mx-auto w-full font-sans shadow-sm flex flex-col gap-3">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full relative overflow-hidden bg-gray-100 border border-gray-100 flex-shrink-0">
          {user?.avatar ? (
            <Image src={user.avatar} alt="Avatar" fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center text-white font-bold text-xs">
              @
            </div>
          )}
        </div>
        <span className="font-semibold text-[15px] text-black leading-tight">
          {user?.name || "threads_user"}
        </span>
      </div>
      <MoreHorizontal size={18} className="text-black" />
    </div>

    {/* Content */}
    {postText && (
      <div className="text-[15px] text-black leading-snug whitespace-pre-wrap">{postText}</div>
    )}

    {/* Image / Media */}
    {/* Image / Media */}
    {filePreviews.length > 0 && (
      <div className="relative w-full rounded-xl overflow-hidden border border-gray-100 group bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={filePreviews[0]}
          alt="Post"
          className="w-full h-auto max-h-[600px] object-contain mx-auto"
        />
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px]">
          Alt
        </div>
      </div>
    )}

    {/* Action Bar */}
    <div className="flex items-center gap-4 mt-1 text-black">
      <div className="flex items-center gap-1.5 cursor-pointer group">
        <Heart size={20} className="stroke-[2px] group-hover:text-red-500 transition-colors" />
        <span className="text-[13px] text-gray-500">1.2K</span>
      </div>
      <div className="flex items-center gap-1.5 cursor-pointer group">
        <MessageCircle
          size={20}
          className="stroke-[2px] -scale-x-100 group-hover:text-gray-900 transition-colors"
        />
        <span className="text-[13px] text-gray-500">45</span>
      </div>
      <div className="flex items-center gap-1.5 cursor-pointer group">
        <Repeat size={20} className="stroke-[2px] group-hover:text-gray-900 transition-colors" />
        <span className="text-[13px] text-gray-500">12</span>
      </div>
      <Send
        size={20}
        className="stroke-[2px] cursor-pointer hover:text-gray-900 transition-colors"
      />
    </div>
  </div>
);

const MastodonPreview = ({
  user,
  postText,
  filePreviews,
}: {
  user: User | null;
  postText: string;
  filePreviews: string[];
}) => (
  <div className="bg-white text-[#1f232b] rounded border border-gray-200 p-4 max-w-xl mx-auto w-full font-sans shadow-sm">
    {/* Header */}
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md relative overflow-hidden bg-gray-100 flex-shrink-0">
          {user?.avatar ? (
            <Image src={user.avatar} alt="Avatar" fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-[#6364ff] flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[15px] leading-tight text-gray-900">
            {user?.name || "Mastodon User"}
          </span>
          <span className="text-[15px] text-gray-500 leading-tight">mastodon</span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-gray-500 text-[14px]">
        <Globe size={14} />
        <span>1s</span>
      </div>
    </div>

    {/* Content */}
    <div className="mb-3">
      {postText && (
        <p className="text-[15px] leading-normal whitespace-pre-wrap text-gray-900 mb-3">
          {postText}
        </p>
      )}
      {filePreviews.length > 0 && (
        <div className="relative w-full rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={filePreviews[0]}
            alt="Post"
            className="w-full h-auto max-h-[600px] object-contain mx-auto"
          />
          <div className="absolute bottom-2 left-2 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px]">
            ALT
          </div>
        </div>
      )}
    </div>

    {/* Action Bar */}
    <div className="flex items-center justify-between text-gray-500 px-1">
      <Reply size={20} className="cursor-pointer hover:text-blue-500 transition-colors" />
      <Repeat size={20} className="cursor-pointer hover:text-green-500 transition-colors" />
      <Star size={20} className="cursor-pointer hover:text-yellow-500 transition-colors" />
      <Bookmark size={20} className="cursor-pointer hover:text-blue-500 transition-colors" />
      <MoreHorizontal size={20} className="cursor-pointer hover:text-gray-700 transition-colors" />
    </div>
  </div>
);

const BlueskyPreview = ({
  user,
  postText,
  filePreviews,
}: {
  user: User | null;
  postText: string;
  filePreviews: string[];
}) => (
  <div className="bg-white text-black p-4 rounded-xl border border-gray-200 font-sans shadow-sm max-w-xl mx-auto w-full flex flex-col gap-3">
    {/* Header */}
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gray-100 relative overflow-hidden">
          {user?.avatar ? (
            <Image src={user.avatar} alt="Avatar" fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap leading-5">
          <span className="font-bold text-[15px] text-black shrink-0">
            {user?.name || "Bluesky User"}
          </span>
          <span className="text-gray-500 text-[15px] shrink-0 truncate max-w-[120px]">
            @{user?.email?.split("@")[0] || "handle.bsky.social"}
          </span>
          <span className="text-gray-500 text-[15px] shrink-0">· 4h</span>
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="mt-0.5 mb-2">
      {postText && (
        <p className="text-[15px] leading-normal whitespace-pre-wrap break-words text-black mb-2">
          {/* Simple hashtag highlighting logic for preview */}
          {postText.split(" ").map((word, i) =>
            word.startsWith("#") ? (
              <span key={i} className="text-[#0085ff] mr-1">
                {word}
              </span>
            ) : (
              <span key={i} className="mr-1">
                {word}
              </span>
            ),
          )}
        </p>
      )}
      {filePreviews.length > 0 && (
        <div className="relative w-full rounded-xl overflow-hidden border border-gray-100 mt-2 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={filePreviews[0]}
            alt="Post"
            className="w-full h-auto max-h-[600px] object-contain mx-auto"
          />
          <div className="absolute bottom-3 right-3 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-[4px]">
            ALT
          </div>
        </div>
      )}
    </div>

    {/* Action Bar */}
    <div className="flex items-center justify-between pr-2 text-gray-500">
      <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-500">
        <MessageSquare size={18} />
        <span className="text-[13px] font-medium">93</span>
      </div>
      <div className="flex items-center gap-2 group cursor-pointer hover:text-green-500">
        <Repeat size={18} />
        <span className="text-[13px] font-medium">309</span>
      </div>
      <div className="flex items-center gap-2 group cursor-pointer hover:text-pink-500">
        <Heart size={18} />
        <span className="text-[13px] font-medium">3.9K</span>
      </div>
      <div className="flex items-center gap-4">
        <Bookmark size={19} className="cursor-pointer hover:text-blue-500" />
        <Share size={18} className="cursor-pointer hover:text-blue-500" />
        <MoreHorizontal size={18} className="cursor-pointer hover:text-gray-700" />
      </div>
    </div>
  </div>
);

const GenericPreview = ({
  platform,
  user,
  postText,
  filePreviews,
}: {
  platform: Platform;
  user: User | null;
  postText: string;
  filePreviews: string[];
}) => (
  <div className="bg-white text-gray-900 border border-gray-200 rounded-xl shadow-sm max-w-xl mx-auto w-full flex flex-col">
    <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50 rounded-t-xl">
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-white shadow-sm scale-90",
          platform.color,
        )}
      >
        {platform.icon}
      </div>
      <span className="font-semibold text-sm text-gray-700">{platform.name} Preview</span>
    </div>
    <div className="p-4">
      <div className="flex gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden relative">
          {user?.avatar && <Image src={user.avatar} alt="User" fill className="object-cover" />}
        </div>
        <div>
          <div className="font-semibold text-sm">{user?.name}</div>
          <div className="text-xs text-gray-500">Just now</div>
        </div>
      </div>
      <div className="space-y-3">
        {postText && <p className="text-sm whitespace-pre-wrap">{postText}</p>}
        {filePreviews.length > 0 && (
          <div className="relative rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={filePreviews[0]}
              alt="Post"
              className="w-full h-auto max-h-[400px] object-contain mx-auto"
            />
          </div>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 flex gap-6 text-gray-400">
        <Heart size={20} />
        <MessageCircle size={20} />
        <Share size={20} />
      </div>
    </div>
  </div>
);

export function PostPreview({
  user,
  postText,
  filePreviews,
  availablePlatforms,
  selectedPlatforms,
  onBack,
  onPostNow,
  isScheduleOpen,
  setIsScheduleOpen,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  handleScheduleConfirm,
  timeZone,
  connectedAccounts,
}: PostPreviewProps) {
  return (
    <div className="flex flex-col h-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Preview Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full hover:bg-white hover:shadow-sm"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Posts</h1>
          <p className="text-gray-500 text-sm">Check how your content looks on each platform</p>
        </div>
      </div>

      {/* Previews Grid */}
      <div className=" h-auto mb-8 pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
          {availablePlatforms
            .filter((p) => selectedPlatforms.includes(p.id))
            .map((platform) => {
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
                      platformHandle = profile?.name; // FB uses name as main identifier usually
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
                  // Logic from ConnectedPlatformsCard: displayName || handle || platform
                  const displayName =
                    profile?.displayName || profile?.name || platformHandle || user.name;

                  return {
                    ...user,
                    name: displayName,
                    avatar: profile?.avatar || user.avatar,
                    // Use email field for handle display in previews
                    email: platformHandle || user.email,
                  };
                }

                return user;
              };

              const platformUser = getPlatformUser(platform.id);

              return (
                <div key={platform.id} className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-900 text-sm font-semibold bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                    <div className="relative w-5 h-5">
                      {/* Manually mapping logos based on ID since platform.icon is ReactNode */}
                      {platform.id === "threads" ? (
                        <Image
                          src="/images/logos/threads.png"
                          alt="Threads"
                          fill
                          className="object-contain"
                        />
                      ) : platform.id === "bluesky" ? (
                        <Image
                          src="/images/logos/bluesky.png"
                          alt="Bluesky"
                          fill
                          className="object-contain"
                        />
                      ) : platform.id === "mastodon" ? (
                        <Image
                          src="/images/logos/mastodon.png"
                          alt="Mastodon"
                          fill
                          className="object-contain"
                        />
                      ) : platform.id === "tumblr" ? (
                        <Image
                          src="/images/logos/tumblr.png"
                          alt="Tumblr"
                          fill
                          className="object-contain"
                        />
                      ) : platform.id === "facebook" ? (
                        <div className="w-full h-full bg-[#1877F2] rounded-full flex items-center justify-center p-1">
                          <svg viewBox="0 0 24 24" className="w-full h-full fill-white">
                            <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                          </svg>
                        </div>
                      ) : platform.id === "instagram" ? (
                        <div className="w-full h-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] rounded-full flex items-center justify-center p-1">
                          <svg
                            viewBox="0 0 24 24"
                            className="w-full h-full fill-none stroke-white stroke-[1.5]"
                          >
                            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                          </svg>
                        </div>
                      ) : (
                        <div
                          className={cn(
                            "w-full h-full rounded-full",
                            platform.color.replace("bg-", "bg-").replace("text-", "text-"),
                          )}
                        />
                      )}
                    </div>
                    {platform.name}
                  </div>

                  {platform.id === "bluesky" ? (
                    <BlueskyPreview
                      user={platformUser}
                      postText={postText}
                      filePreviews={filePreviews}
                    />
                  ) : platform.id === "facebook" ? (
                    <FacebookPreview
                      user={platformUser}
                      postText={postText}
                      filePreviews={filePreviews}
                    />
                  ) : platform.id === "instagram" ? (
                    <InstagramPreview
                      user={platformUser}
                      postText={postText}
                      filePreviews={filePreviews}
                    />
                  ) : platform.id === "mastodon" ? (
                    <MastodonPreview
                      user={platformUser}
                      postText={postText}
                      filePreviews={filePreviews}
                    />
                  ) : platform.id === "threads" ? (
                    <ThreadsPreview
                      user={platformUser}
                      postText={postText}
                      filePreviews={filePreviews}
                    />
                  ) : platform.id === "tumblr" ? (
                    <TumblrPreview
                      user={platformUser}
                      postText={postText}
                      filePreviews={filePreviews}
                    />
                  ) : (
                    <GenericPreview
                      platform={platform}
                      user={platformUser}
                      postText={postText}
                      filePreviews={filePreviews}
                    />
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Bottom Action Bar (Preview Mode) */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="gap-2 rounded-full h-12 px-6 border-gray-300 hover:bg-white text-gray-700 font-medium w-full sm:w-auto order-2 sm:order-1"
          >
            Back to Edit
          </Button>

          <div className="flex gap-3 w-full sm:w-auto order-1 sm:order-2">
            <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none gap-2 rounded-full h-12 px-6 border-2 border-primary/20 hover:bg-primary/5 hover:text-primary text-primary font-semibold"
                >
                  <Calendar size={18} />
                  Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white gap-0 rounded-3xl">
                <div className="flex flex-col md:flex-row h-[500px]">
                  {/* Dialog Left: Preview Image */}
                  <div className="bg-gray-100 w-full md:w-5/12 relative hidden md:block">
                    {filePreviews[0] ? (
                      <Image
                        src={filePreviews[0]}
                        alt="Scheduled Post"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <ImageIcon size={48} />
                        <p className="absolute mt-20 text-sm">No media selected</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                      <p className="text-white font-medium line-clamp-3 text-sm">
                        {postText || "No caption provided..."}
                      </p>
                    </div>
                  </div>

                  {/* Dialog Right: Controls */}
                  <div className="flex-1 p-8 flex flex-col">
                    <DialogHeader className="mb-6">
                      <DialogTitle className="text-2xl font-bold">Schedule Post</DialogTitle>
                      <p className="text-gray-500 text-sm">
                        Choose the best time for your audience.
                      </p>
                    </DialogHeader>

                    <div className="space-y-6 flex-1">
                      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                        <span className="text-sm font-medium text-gray-600">Time Zone</span>
                        <span className="text-sm text-gray-900 font-semibold flex items-center gap-2">
                          <Globe size={14} /> {timeZone}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Label>Select Date</Label>
                        <div className="relative">
                          <Input
                            type="date"
                            className="h-12 rounded-xl pl-4 pr-10 text-base"
                            value={scheduleDate}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setScheduleDate(e.target.value)
                            }
                          />
                          <Calendar
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            size={18}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Select Time</Label>
                        <div className="relative">
                          <Input
                            type="time"
                            className="h-12 rounded-xl pl-4 pr-10 text-base"
                            value={scheduleTime}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setScheduleTime(e.target.value)
                            }
                          />
                          <Clock
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                            size={18}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-gray-100 flex justify-end gap-3">
                      <Button variant="ghost" onClick={() => setIsScheduleOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleScheduleConfirm}
                        className="rounded-full bg-[#318D62] hover:bg-[#287350] px-8"
                        disabled={!scheduleDate || !scheduleTime}
                      >
                        Schedule Post
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={onPostNow}
              className="flex-1 sm:flex-none gap-2 rounded-full h-12 px-8 bg-[#318D62] hover:bg-[#287350] shadow-lg shadow-green-900/20 text-lg"
            >
              Post Now
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
