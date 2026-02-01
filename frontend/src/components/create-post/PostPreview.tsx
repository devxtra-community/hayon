import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Calendar, Send, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Platform, User, PlatformPost } from "@/types/create-post";
import { SocialAccount } from "@hayon/schemas";
// import { useToast } from "@/context/ToastContext";

// Components
import { EditPlatformPostModal } from "./EditPlatformPostModal";
import { FacebookPreview } from "./FacebookPreview";
import { InstagramPreview } from "./InstagramPreview";
import { ThreadsPreview } from "./ThreadsPreview";
import { MastodonPreview } from "./MastodonPreview";
import { BlueskyPreview } from "./BlueskyPreview";
import { TumblrPreview } from "./TumblrPreview";
import { GenericPreview } from "./GenericPreview";
import { SchedulePostDialog } from "./SchedulePostDialog";

// Hooks
import { usePlatformUser } from "@/hooks/usePlatformUser";

interface PostPreviewProps {
  user: User | null;
  postText: string;
  filePreviews: string[];
  mediaFiles: File[];
  availablePlatforms: Platform[];
  selectedPlatforms: string[];
  onBack: () => void;
  onPostNow: () => void;
  onSaveDraft: () => void;
  isScheduleOpen: boolean;
  setIsScheduleOpen: (open: boolean) => void;
  scheduleDate: string;
  setScheduleDate: (date: string) => void;
  scheduleTime: string;
  setScheduleTime: (time: string) => void;
  handleScheduleConfirm: () => void;
  timeZone: string;
  connectedAccounts: SocialAccount | null;
  platformPosts: Record<string, PlatformPost>;
  updatePlatformPost: (id: string, updates: Partial<PlatformPost>) => void;
  refinePlatformPostWithLLM: (id: string, prompt: string) => Promise<void>;
  isGenerating: boolean;
  platformWarnings: Record<string, string[]>;
}

export function PostPreview({
  user,
  postText,
  filePreviews,
  availablePlatforms,
  selectedPlatforms,
  onBack,
  onPostNow,
  onSaveDraft,
  isScheduleOpen,
  setIsScheduleOpen,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  handleScheduleConfirm,
  timeZone,
  connectedAccounts,
  platformPosts,
  updatePlatformPost,
  refinePlatformPostWithLLM,
  isGenerating,
  platformWarnings,
}: PostPreviewProps) {
  const [editingPlatformId, setEditingPlatformId] = useState<string | null>(null);
  const { getPlatformUser } = usePlatformUser(user, connectedAccounts);
  // const { showToast } = useToast();

  // Removed local scheduling logic to use centralized handleScheduleConfirm from useCreatePost

  // FUTURE: This component primarily handles the UI for previewing posts.
  // The actual state management and API calls are lifted up to the parent component or custom hooks.
  //
  // Backend Integration Points:
  // 1. `onPostNow`: Triggers the immediate publishing flow. Use `/api/posts/create` (POST).
  // 2. `handleScheduleConfirm`: Triggers the scheduling flow. Use `/api/posts/schedule` (POST).
  // 3. `refinePlatformPostWithLLM`: Calls the AI service. Use `/api/ai/refine` (POST).

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
      <div className="h-auto mb-8 pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
          {availablePlatforms
            .filter((p) => selectedPlatforms.includes(p.id))
            .map((platform) => {
              const platformUser = getPlatformUser(platform.id);
              const postData = platformPosts[platform.id] || {
                text: postText,
                filePreviews,
                mediaFiles: [],
              };
              const warnings = platformWarnings[platform.id] || [];

              return (
                <div
                  key={platform.id}
                  className="group/preview relative flex flex-col bg-white rounded-[2.5rem] border border-slate-200 p-2 pb-6 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                >
                  {/* Platform Header */}
                  <div className="flex items-center justify-between px-4 py-3 mb-4">
                    {warnings.length > 0 && (
                      <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-xs font-semibold px-4 py-1 rounded-t-[2.5rem] flex items-center justify-center z-10">
                        {warnings[0]}
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <div className="relative w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 p-1.5 flex items-center justify-center">
                        {/* 
                            FUTURE: Optimize logo rendering using a dedicated component or SVG map.
                            Currently dealing with distinct assets for each platform. 
                         */}
                        {platform.id === "threads" ? (
                          <Image
                            src="/images/logos/threads.png"
                            alt="Threads"
                            fill
                            className="object-contain p-1"
                          />
                        ) : platform.id === "bluesky" ? (
                          <Image
                            src="/images/logos/bluesky.png"
                            alt="Bluesky"
                            fill
                            className="object-contain p-1"
                          />
                        ) : platform.id === "mastodon" ? (
                          <Image
                            src="/images/logos/mastodon.png"
                            alt="Mastodon"
                            fill
                            className="object-contain p-1"
                          />
                        ) : platform.id === "tumblr" ? (
                          <Image
                            src="/images/logos/tumblr.png"
                            alt="Tumblr"
                            fill
                            className="object-contain p-1"
                          />
                        ) : platform.id === "facebook" ? (
                          <div className="w-full h-full bg-[#1877F2] rounded-full flex items-center justify-center">
                            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-white">
                              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                            </svg>
                          </div>
                        ) : platform.id === "instagram" ? (
                          <div className="w-full h-full bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] rounded-full flex items-center justify-center">
                            <svg
                              viewBox="0 0 24 24"
                              className="w-3 h-3 fill-none stroke-white stroke-[2.5]"
                            >
                              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                            </svg>
                          </div>
                        ) : (
                          <div className={cn("w-full h-full rounded-full", platform.color)} />
                        )}
                      </div>
                      <span className="font-bold text-slate-900 tracking-tight">
                        {platform.name}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPlatformId(platform.id)}
                      className="rounded-full bg-white shadow-sm border border-slate-200 hover:bg-slate-50 h-9 px-4 gap-2 text-slate-600 font-medium transition-all hover:text-primary hover:border-primary/30"
                    >
                      <Edit2 size={14} />
                      <span className="text-xs">Customize</span>
                    </Button>
                  </div>

                  {/* Render Platform Specific Preview */}
                  <div className="px-2">
                    {platform.id === "bluesky" ? (
                      <BlueskyPreview
                        user={platformUser}
                        postText={postData.text}
                        filePreviews={postData.filePreviews}
                      />
                    ) : platform.id === "facebook" ? (
                      <FacebookPreview
                        user={platformUser}
                        postText={postData.text}
                        filePreviews={postData.filePreviews}
                      />
                    ) : platform.id === "instagram" ? (
                      <InstagramPreview
                        user={platformUser}
                        postText={postData.text}
                        filePreviews={postData.filePreviews}
                      />
                    ) : platform.id === "mastodon" ? (
                      <MastodonPreview
                        user={platformUser}
                        postText={postData.text}
                        filePreviews={postData.filePreviews}
                      />
                    ) : platform.id === "threads" ? (
                      <ThreadsPreview
                        user={platformUser}
                        postText={postData.text}
                        filePreviews={postData.filePreviews}
                      />
                    ) : platform.id === "tumblr" ? (
                      // TumblrPreview component is already available in the directory
                      <TumblrPreview
                        user={platformUser}
                        postText={postData.text}
                        filePreviews={postData.filePreviews}
                      />
                    ) : (
                      <GenericPreview
                        platform={platform}
                        user={platformUser}
                        postText={postData.text}
                        filePreviews={postData.filePreviews}
                      />
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {editingPlatformId && (
        <EditPlatformPostModal
          isOpen={!!editingPlatformId}
          onClose={() => setEditingPlatformId(null)}
          platform={availablePlatforms.find((p) => p.id === editingPlatformId)!}
          post={
            platformPosts[editingPlatformId] || {
              text: postText,
              filePreviews,
              mediaFiles: [],
            }
          }
          onUpdate={(updates) => updatePlatformPost(editingPlatformId, updates)}
          onRefine={(prompt) => refinePlatformPostWithLLM(editingPlatformId, prompt)}
          isGenerating={isGenerating}
        />
      )}

      {/* Bottom Action Bar */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-3 w-full sm:w-auto order-2 sm:order-1">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-1 sm:flex-none gap-2 rounded-full h-12 px-6 border-gray-300 hover:bg-white text-gray-700 font-medium"
            >
              {/* Logic: Navigates back to the creation form */}
              Back to Edit
            </Button>

            <Button
              variant="outline"
              onClick={onSaveDraft}
              className="flex-1 sm:flex-none gap-2 rounded-full h-12 px-6 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
            >
              Save as Draft
            </Button>
          </div>

          <div className="flex gap-3 w-full sm:w-auto order-1 sm:order-2">
            {/* Schedule trigger button */}
            <Button
              variant="outline"
              onClick={() => setIsScheduleOpen(true)}
              className="flex-1 sm:flex-none gap-2 rounded-full h-12 px-6 border-2 border-primary/20 hover:bg-primary/5 hover:text-primary text-primary font-semibold"
            >
              <Calendar size={18} />
              Schedule
            </Button>

            <SchedulePostDialog
              isOpen={isScheduleOpen}
              onOpenChange={setIsScheduleOpen}
              filePreviews={filePreviews}
              postText={postText}
              timeZone={timeZone}
              scheduleDate={scheduleDate}
              setScheduleDate={setScheduleDate}
              scheduleTime={scheduleTime}
              setScheduleTime={setScheduleTime}
              onConfirm={() => {
                // BACKEND: This will trigger the schedule creation.
                // The backend will create a cron job or delayed task (via RabbitMQ) to publish the post at the specified time.
                handleScheduleConfirm();
              }}
            />

            <Button
              onClick={() => {
                // BACKEND: Immediate post creation.
                // 1. Upload media to S3 (if not already).
                // 2. Call Platform APIs (Facebook Graph API, Twitter API, etc.).
                // 3. Save post record in DB with status 'published' or 'failed'.
                onPostNow();
              }}
              className="flex-1 sm:flex-none gap-2 rounded-full h-12 px-8 bg-[#318D62] hover:bg-[#287350] shadow-lg shadow-green-900/20 text-lg"
            >
              Post Now <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
