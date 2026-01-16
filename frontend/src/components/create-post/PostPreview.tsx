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
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Platform, User } from "@/types/create-post";
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
}

// --- Specific Previews ---

const BlueskyPreview = ({
  user,
  postText,
  filePreviews,
}: {
  user: User | null;
  postText: string;
  filePreviews: string[];
}) => (
  <div className="bg-[#161e27] text-white p-4 rounded-xl border border-gray-800 font-sans shadow-lg max-w-xl mx-auto w-full">
    <div className="flex gap-3">
      <div className="flex-shrink-0">
        {user?.avatar ? (
          <div className="w-10 h-10 rounded-full overflow-hidden relative border border-gray-700">
            <Image src={user.avatar} alt="Avatar" fill className="object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-700" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-[15px] text-white leading-5">{user?.name}</span>
          <span className="text-gray-500 text-[15px] leading-5 truncate">
            @{user?.email?.split("@")[0] || "handle.bsky.social"}
          </span>
          <span className="text-gray-500 text-[15px] leading-5">· 1m</span>
        </div>

        {postText && (
          <p className="mt-1 text-[15px] whitespace-pre-wrap leading-[1.4] text-white/90">
            {postText}
          </p>
        )}

        {filePreviews.length > 0 && (
          <div className="mt-3 relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-gray-700/50">
            <Image src={filePreviews[0]} alt="Post image" fill className="object-cover" />
          </div>
        )}

        <div className="flex justify-between mt-3 text-gray-500 max-w-[350px]">
          <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-400">
            <div className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition-colors">
              <MessageCircle size={18} />
            </div>
            <span className="text-xs">0</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer hover:text-green-400">
            <div className="p-1.5 rounded-full group-hover:bg-green-500/10 transition-colors">
              <Repeat size={18} />
            </div>
            <span className="text-xs">0</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer hover:text-pink-400">
            <div className="p-1.5 rounded-full group-hover:bg-pink-500/10 transition-colors">
              <Heart size={18} />
            </div>
            <span className="text-xs">0</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer hover:text-blue-400">
            <div className="p-1.5 rounded-full group-hover:bg-blue-500/10 transition-colors">
              <MoreHorizontal size={18} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TumblrPreview = ({
  user,
  postText,
  filePreviews,
}: {
  user: User | null;
  postText: string;
  filePreviews: string[];
}) => (
  <div className="bg-[#121212] text-white rounded-lg shadow-lg max-w-xl mx-auto w-full overflow-hidden font-sans border border-gray-800">
    {/* Header */}
    <div className="p-3 px-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-sm relative overflow-hidden bg-white">
          {user?.avatar ? (
            <Image src={user.avatar} fill className="object-cover" alt="avatar" />
          ) : (
            <div className="bg-red-500 w-full h-full" />
          )}
        </div>
        <span className="font-bold text-[15px] hover:underline cursor-pointer">
          {user?.name || "tumblr_user"}
        </span>
      </div>
      <MoreHorizontal className="text-gray-400 cursor-pointer hover:text-white" size={20} />
    </div>

    {/* Content */}
    <div className="w-full bg-[#121212] flex flex-col">
      {filePreviews.length > 0 ? (
        <div className="relative w-full aspect-video">
          <Image src={filePreviews[0]} alt="Post" fill className="object-cover" />
        </div>
      ) : null}
    </div>

    {/* Text/Caption */}
    {postText && (
      <div className="p-4 pb-2">
        <p className="text-[17px] leading-relaxed font-serif text-white/90">{postText}</p>
      </div>
    )}

    {/* Fake Tags */}
    <div className="px-4 py-2 flex flex-wrap gap-x-2 gap-y-1 text-[#a8a8a8] text-[15px]">
      <span className="hover:underline cursor-pointer">#love</span>
      <span className="hover:underline cursor-pointer">#quotes</span>
      <span className="hover:underline cursor-pointer">#poetry</span>
      <span className="hover:underline cursor-pointer">#poem</span>
      <span className="hover:underline cursor-pointer">#literature</span>
    </div>

    {/* Footer */}
    <div className="px-4 py-3 flex items-center justify-between text-gray-300 mt-1">
      <div className="flex items-center gap-6">
        <MessageCircle size={24} strokeWidth={1.5} className="cursor-pointer hover:text-white" />
        <div className="flex items-center gap-1 text-[#00b8ff] cursor-pointer hover:text-[#00cf30]">
          <Repeat size={24} strokeWidth={1.5} />
          <span className="text-sm font-bold text-white/90">871</span>
        </div>
        <div className="flex items-center gap-1 text-[#ff4930] cursor-pointer hover:text-[#ff4930]/80">
          <Heart size={24} strokeWidth={1.5} fill="#ff4930" />
          <span className="text-sm font-bold text-white/90">1.6K</span>
        </div>
      </div>
      <Share size={20} strokeWidth={1.5} className="cursor-pointer hover:text-white" />
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
          <div className="relative rounded-lg overflow-hidden border border-gray-100 aspect-video max-h-[400px]">
            <Image src={filePreviews[0]} alt="Post" fill className="object-cover" />
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
            .map((platform) => (
              <div key={platform.id} className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium bg-white px-4 py-1.5 rounded-full shadow-sm border border-gray-100">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      platform.color.replace("bg-", "bg-").replace("text-", "text-"),
                    )}
                  />
                  {platform.name}
                </div>

                {platform.id === "bluesky" ? (
                  <BlueskyPreview user={user} postText={postText} filePreviews={filePreviews} />
                ) : platform.id === "tumblr" ? (
                  <TumblrPreview user={user} postText={postText} filePreviews={filePreviews} />
                ) : (
                  <GenericPreview
                    platform={platform}
                    user={user}
                    postText={postText}
                    filePreviews={filePreviews}
                  />
                )}
              </div>
            ))}
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
