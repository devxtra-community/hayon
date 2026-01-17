"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/dashboard"; // Removed Header import since unused

import { useCreatePost } from "@/hooks/useCreatePost";
import { PlatformSelection } from "@/components/create-post/PlatformSelection";
import { CreatePostForm } from "@/components/create-post/CreatePostForm";
import { PostPreview } from "@/components/create-post/PostPreview";

export default function CreatePostPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    user,
    viewMode,
    setViewMode,
    postText,
    setPostText,
    mediaFiles,
    filePreviews,
    availablePlatforms,
    selectedPlatforms,
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
    connectedAccounts,
    errors,
    platformPosts,
    updatePlatformPost,
    refinePlatformPostWithLLM,
  } = useCreatePost();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden p-2 lg:p-4 gap-4 relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 lg:hidden transition-opacity duration-300",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-72 bg-none transition-transform duration-300 transform",
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Sidebar />
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Success Overlay */}
        {isSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-3xl animate-in fade-in duration-300">
            <div className="text-center bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 max-w-sm w-full transform animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-500 mb-6">
                Your post has been successfully scheduled/published.
              </p>
              <Button
                onClick={() => setIsSuccess(false)}
                className="w-full h-12 rounded-xl text-base"
              >
                Create Another
              </Button>
            </div>
          </div>
        )}

        {/* Loading/Submitting Overlay */}
        {isSubmitting && !isSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-3xl">
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-gray-600 font-medium">Processing your post...</p>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-4 py-6 lg:px-8 lg:py-8 scrollbar-hide relative flex flex-col">
          {viewMode === "create" ? (
            <div className="flex-1 flex flex-col lg:flex-row gap-8">
              {/* Left Column: Form */}
              <CreatePostForm
                postText={postText}
                setPostText={setPostText}
                handleFileChange={handleFileChange}
                filePreviews={filePreviews}
                removeFile={removeFile}
                errors={errors}
                selectedPlatforms={selectedPlatforms}
                availablePlatforms={availablePlatforms}
              />

              {/* Right Column: Platform Selection */}
              <div className="w-full lg:w-[400px]">
                <PlatformSelection
                  availablePlatforms={availablePlatforms}
                  selectedPlatforms={selectedPlatforms}
                  onToggle={togglePlatform}
                  isGenerating={isGenerating}
                  onGenerate={handleGeneratePosts}
                  canGenerate={!!postText || mediaFiles.length > 0}
                />
              </div>
            </div>
          ) : (
            // --- PREVIEW MODE ---
            <PostPreview
              user={user}
              postText={postText}
              filePreviews={filePreviews}
              availablePlatforms={availablePlatforms}
              selectedPlatforms={selectedPlatforms}
              onBack={() => setViewMode("create")}
              onPostNow={handlePostNow}
              isScheduleOpen={isScheduleOpen}
              setIsScheduleOpen={setIsScheduleOpen}
              scheduleDate={scheduleDate}
              setScheduleDate={setScheduleDate}
              scheduleTime={scheduleTime}
              setScheduleTime={setScheduleTime}
              handleScheduleConfirm={handleScheduleConfirm}
              timeZone={timeZone}
              connectedAccounts={connectedAccounts}
              platformPosts={platformPosts}
              updatePlatformPost={updatePlatformPost}
              refinePlatformPostWithLLM={refinePlatformPostWithLLM}
              isGenerating={isGenerating}
            />
          )}
        </main>
      </div>
    </div>
  );
}
