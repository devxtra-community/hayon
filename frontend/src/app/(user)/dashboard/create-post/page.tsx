"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingH } from "@/components/ui/loading-h";
import Router from "next/router";

import { useCreatePost } from "@/hooks/useCreatePost";
import { PlatformSelection } from "@/components/create-post/PlatformSelection";
import { CreatePostForm } from "@/components/create-post/CreatePostForm";
import { PostPreview } from "@/components/create-post/PostPreview";
import { useSearchParams } from "next/navigation";
import { SubmittingOverlay } from "@/components/create-post/SubmittingOverlay";

export default function CreatePostPage() {
  const searchParams = useSearchParams();
  const router = Router;
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
    platformWarnings,
    platformPosts,
    updatePlatformPost,
    refinePlatformPostWithLLM,
    loadDraft,
    draftId,
  } = useCreatePost();

  // Load draft if draftId query param is present
  useEffect(() => {
    const draftIdParam = searchParams.get("draftId");
    if (draftIdParam && !draftId) {
      loadDraft(draftIdParam);
    }
  }, [searchParams, draftId, loadDraft]);

  if (!user) {
    return <LoadingH />;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden p-2 lg:p-4 gap-4 relative">
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
                {successMessage || "Your post has been successfully processed."}
              </p>
              <Button
                onClick={() => {
                  router.push("/dashboard/create-post");
                  setIsSuccess(false);
                }}
                className="w-full h-12 rounded-xl text-base"
              >
                Create Another
              </Button>
            </div>
          </div>
        )}

        {/* Loading/Submitting Overlay */}
        <SubmittingOverlay
          isSubmitting={isSubmitting && !isSuccess}
          selectedPlatformIds={selectedPlatforms}
          availablePlatforms={availablePlatforms}
        />

        {/* Main Content Area */}
        <main className="flex-1 bg-[#F7F7F7] rounded-3xl overflow-y-auto px-4 py-6 lg:px-8 lg:py-8 scrollbar-hide relative flex flex-col">
          {viewMode === "create" ? (
            <div className="flex-1 flex flex-col lg:flex-row gap-8">
              {/* Left Column: Form */}
              <CreatePostForm
                postText={postText}
                setPostText={setPostText}
                handleFileChange={handleFileChange}
                mediaFiles={mediaFiles}
                filePreviews={filePreviews}
                removeFile={removeFile}
                errors={errors}
                platformWarnings={platformWarnings}
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
              onSaveDraft={handleSaveDraft}
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
              mediaFiles={mediaFiles}
              isGenerating={isGenerating}
              platformWarnings={platformWarnings}
            />
          )}
        </main>
      </div>
    </div>
  );
}
