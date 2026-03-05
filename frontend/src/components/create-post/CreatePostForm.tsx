import React, { useState } from "react";
import { Upload, X, Save, Sparkles, ChevronDown, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Platform } from "@/types/create-post";
import { api } from "@/lib/axios";
import { useToast } from "@/context/ToastContext";
import { GLOBAL_CONSTRAINTS } from "@hayon/schemas";
import { AlertTriangle } from "lucide-react";

interface CreatePostFormProps {
  postText: string;
  setPostText: (text: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mediaFiles: File[];
  filePreviews: string[];
  removeFile: (index: number) => void;
  errors: string[];
  platformWarnings: Record<string, string[]>;
  selectedPlatforms: string[];
  availablePlatforms: Platform[];
}

const LLM_MODELS = [{ id: "gemini-1.5-flash", name: "gemini-2.5 flash", provider: "Gemini" }];

export function CreatePostForm({
  postText,
  setPostText,
  handleFileChange,
  mediaFiles,
  filePreviews,
  removeFile,
  errors,
  platformWarnings,
  selectedPlatforms,
  availablePlatforms,
}: CreatePostFormProps) {
  const [selectedModel, setSelectedModel] = useState(LLM_MODELS[0]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const { showToast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string); // "data:<mime>;base64,..."
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  const handleGenerateCaption = async () => {
    // 1. Check for oversized files
    const oversizedFilesCount = mediaFiles.filter(
      (f) => f.size > GLOBAL_CONSTRAINTS.maxGlobalFileSize,
    ).length;

    if (oversizedFilesCount > 0) {
      const limitMB = Math.floor(GLOBAL_CONSTRAINTS.maxGlobalFileSize / (1024 * 1024));
      showToast(
        "error",
        "Files too large",
        `Some images are too large for AI processing (max ${limitMB}MB). Please remove them and try again.`,
      );
      return;
    }

    setIsGenerating(true);
    try {
      const base64List = await Promise.all(mediaFiles.map(fileToDataUrl));
      const response = await api.post("/generate/captions", {
        modalName: selectedModel.id,
        prompt: postText,
        media: base64List,
      });
      console.log(response);
      const generatedCaption = response.data.data.candidates[0].content.parts[0].text;
      setPostText(generatedCaption);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Create Post</h1>
        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-primary/40 hover:text-primary hover:shadow-sm transition-all duration-200 active:scale-95">
          <Save size={16} />
          Save Draft
        </button>
      </div>

      {/* Validation Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col gap-2">
          {errors.map((error, idx) => (
            <div key={idx} className="flex items-center gap-2 text-red-600 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 flex-shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Validation Warnings */}
      {Object.keys(platformWarnings).length > 0 && (
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex flex-col gap-2">
          {Object.entries(platformWarnings).map(([platformId, warnings]) => (
            <div key={platformId} className="flex flex-col gap-1">
              <span className="font-semibold text-yellow-700 text-xs uppercase tracking-wide">
                {availablePlatforms.find((p) => p.id === platformId)?.name || platformId}
              </span>
              {warnings.map((warning, idx) => (
                <div key={idx} className="flex items-center gap-2 text-yellow-700 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                  {warning}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-white rounded-3xl p-8 border-2 border-dashed border-gray-200 hover:border-primary/50 transition-colors cursor-pointer group relative">
        <input
          type="file"
          multiple={true}
          accept="image/*,video/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="font-medium text-gray-700 text-lg">Drag & drop media</p>
            <p className="text-gray-400 text-sm">or click to browse from your device</p>
          </div>
          <Button
            variant="outline"
            className="mt-2 rounded-full pointer-events-none group-hover:bg-primary group-hover:text-white transition-colors"
          >
            Upload Media
          </Button>
        </div>
      </div>

      {/* Media Previews (Horizontal Scroll) */}
      {filePreviews.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {filePreviews.map((src, idx) => {
            // Check if this specific media file is oversized
            const isOversized = mediaFiles[idx]?.size > GLOBAL_CONSTRAINTS.maxGlobalFileSize;

            return (
              <div
                key={idx}
                className={cn(
                  "relative flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden shadow-sm group bg-white border",
                  isOversized ? "border-red-400 ring-2 ring-red-100" : "border-gray-100",
                )}
              >
                <Image src={src} alt="Preview" fill className="object-cover" />

                {isOversized && (
                  <div className="absolute inset-x-0 bottom-0 bg-red-500/90 text-white p-1 text-[10px] font-bold text-center flex items-center justify-center gap-1 z-10">
                    <AlertTriangle size={10} className="stroke-[3]" />
                    <span>TOO LARGE</span>
                  </div>
                )}

                <button
                  onClick={() => removeFile(idx)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Text Input */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 flex flex-col min-h-[240px]">
        <Textarea
          placeholder="What's on your mind? Type your caption here..."
          className="flex-1 border-none focus-visible:ring-0 resize-none text-lg p-0 placeholder:text-gray-300 shadow-none min-h-[120px]"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
          <div className="flex gap-2 items-center">
            {/* LLM Model Selector */}
            <div className="relative">
              <button
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 transition-colors"
              >
                <Sparkles size={14} className="text-purple-500" />
                <span className="font-medium">{selectedModel.name}</span>
                <ChevronDown
                  size={14}
                  className={cn("transition-transform", isModelDropdownOpen && "rotate-180")}
                />
              </button>

              {isModelDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Select Model
                    </p>
                  </div>
                  {LLM_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setIsModelDropdownOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors",
                        selectedModel.id === model.id && "bg-primary/5",
                      )}
                    >
                      <div>
                        <div className="font-medium text-gray-800 text-sm">{model.name}</div>
                        <div className="text-xs text-gray-400">{model.provider}</div>
                      </div>
                      {selectedModel.id === model.id && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Generate Caption Button */}
            <Button
              onClick={handleGenerateCaption}
              disabled={isGenerating}
              className="ml-2 rounded-full bg-gradient-to-r from-[#318D62] to-[#45b682] hover:from-[#287350] hover:to-[#318D62] text-white shadow-[0_4px_14px_0_rgba(49,141,98,0.3)] hover:shadow-[0_6px_20px_rgba(49,141,98,0.23)] px-6 h-10 text-sm font-semibold gap-2 border-none transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <span className="relative flex items-center gap-2">
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles
                      size={16}
                      className="text-white/90 group-hover:scale-110 transition-transform"
                    />
                    Generate Caption
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "text-xs font-medium",
              selectedPlatforms.some((id) => {
                const p = availablePlatforms.find((plat) => plat.id === id);
                return p?.constraints && postText.length > p.constraints.maxChars;
              })
                ? "text-orange-500"
                : "text-gray-400",
            )}
          >
            {postText.length} characters
          </span>

          {selectedPlatforms.length > 0 && (
            <div className="flex gap-2 items-center">
              {selectedPlatforms.map((id) => {
                const p = availablePlatforms.find((plat) => plat.id === id);
                if (!p?.constraints) return null;
                const isOver = postText.length > p.constraints.maxChars;
                return (
                  <div
                    key={id}
                    title={`${p.name}: max ${p.constraints.maxChars}`}
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isOver ? "bg-red-500 animate-pulse" : "bg-gray-200",
                    )}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
