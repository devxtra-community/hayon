"use client";

import { useState } from "react";
import { Upload, Trash2, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Platform, PlatformPost } from "@/types/create-post";
import { cn } from "@/lib/utils";

interface EditPlatformPostModalProps {
  platform: Platform;
  post: PlatformPost;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: Partial<PlatformPost>) => void;
  onRefine: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}

export function EditPlatformPostModal({
  platform,
  post,
  isOpen,
  onClose,
  onUpdate,
  onRefine,
  isGenerating,
}: EditPlatformPostModalProps) {
  const [localText, setLocalText] = useState(post?.text || "");
  const [llmPrompt, setLlmPrompt] = useState("");

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalText(e.target.value);
    onUpdate({ text: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      onUpdate({
        mediaFiles: [...(post?.mediaFiles || []), ...newFiles],
        filePreviews: [...(post?.filePreviews || []), ...newPreviews],
      });
    }
  };

  const removeFile = (index: number) => {
    const existingCount = post?.existingMedia?.length || 0;
    if (index < existingCount) {
      // Removing an existing media item
      const newExisting = (post?.existingMedia || []).filter((_, i) => i !== index);
      const newPreviews = (post?.filePreviews || []).filter((_, i) => i !== index);
      onUpdate({ existingMedia: newExisting, filePreviews: newPreviews });
    } else {
      // Removing a newly uploaded file
      const relativeIndex = index - existingCount;
      const newFiles = (post?.mediaFiles || []).filter((_, i) => i !== relativeIndex);
      const newPreviews = (post?.filePreviews || []).filter((_, i) => i !== index);
      onUpdate({ mediaFiles: newFiles, filePreviews: newPreviews });
    }
  };

  const handleRefine = async () => {
    if (!llmPrompt.trim()) return;
    await onRefine(llmPrompt);
    setLlmPrompt("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white",
                platform.color,
              )}
            >
              {platform.icon}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Edit {platform.name} Post
              </DialogTitle>
              <p className="text-sm text-gray-500">Customize content for this platform</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          {/* Caption Editor */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Caption</label>
            <div className="relative bg-white rounded-2xl border border-gray-200 p-4 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              <Textarea
                placeholder="What's the caption for this platform?"
                value={localText}
                onChange={handleTextChange}
                className="border-none focus-visible:ring-0 p-0 text-base min-h-[120px] resize-none scrollbar-hide"
              />
              <div className="flex justify-end pt-2">
                <span
                  className={cn(
                    "text-xs font-medium",
                    (localText || "").length > (platform.constraints?.maxChars || 280)
                      ? "text-red-500"
                      : "text-gray-400",
                  )}
                >
                  {(localText || "").length} / {platform.constraints?.maxChars || "∞"}
                </span>
              </div>
            </div>
          </div>

          {/* AI Refinement */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Sparkles size={14} className="text-primary" />
              AI Refine Caption
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., 'Make it punchier' or 'Add relevant hashtags'"
                value={llmPrompt}
                onChange={(e) => setLlmPrompt(e.target.value)}
                className="rounded-xl h-11 bg-gray-50 border-gray-200"
                onKeyDown={(e) => e.key === "Enter" && handleRefine()}
              />
              <Button
                onClick={handleRefine}
                disabled={isGenerating || !llmPrompt.trim()}
                className="rounded-xl h-11 px-4 gap-2 bg-[#101010] hover:bg-black text-white"
              >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                <span>Refine</span>
              </Button>
            </div>
          </div>

          {/* Media Editor */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">Media</label>
            <div className="grid grid-cols-4 gap-4">
              {(post?.filePreviews || []).map((src, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group"
                >
                  <Image
                    width={100}
                    height={100}
                    src={src}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 bg-white/90 backdrop-blur-md p-1.5 rounded-full text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {(post?.filePreviews || []).length < (platform.constraints?.maxImages || 10) && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 hover:border-primary/50 transition-all cursor-pointer">
                  <Upload size={20} className="text-gray-400" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase">Add</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between sm:justify-between">
          <p className="text-xs text-gray-400 max-w-[200px]">
            Changes only apply to your {platform.name} post.
          </p>
          <Button onClick={onClose} className="rounded-xl h-11 bg-primary hover:bg-primary/90 px-8">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
