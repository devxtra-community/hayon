import React, { useState } from "react";
import { Upload, X, Hash, AtSign, Save, Sparkles, ChevronDown, Loader2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Platform } from "@/types/create-post";
import { api } from "@/lib/axios";

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

const SUGGESTED_HASHTAGS = [""];

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
  const [isHashtagPopoverOpen, setIsHashtagPopoverOpen] = useState(false);
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
    setIsGenerating(true);
    try {
      const base64List = await Promise.all(mediaFiles.map(fileToDataUrl));
      const response = await api.post("/posts/generate/captions", {
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

  const addHashtag = (tag: string) => {
    const newText = postText + (postText.endsWith(" ") || postText === "" ? "" : " ") + tag + " ";
    setPostText(newText);
    setIsHashtagPopoverOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Create Post</h1>
        <div className="text-sm text-gray-500">
          Click Generate Preview To See How it willbe Look real platforms
        </div>
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
          {filePreviews.map((src, idx) => (
            <div
              key={idx}
              className="relative flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden shadow-sm group bg-white border border-gray-100"
            >
              <Image src={src} alt="Preview" fill className="object-cover" />
              <button
                onClick={() => removeFile(idx)}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 z-10"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Text Input */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 flex flex-col min-h-[300px]">
        <Textarea
          placeholder="What's on your mind? Type your caption here..."
          className="flex-1 border-none focus-visible:ring-0 resize-none text-lg p-0 placeholder:text-gray-300 shadow-none min-h-[200px]"
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
          <div className="flex gap-2 items-center">
            {/* Hashtag Button with Popover */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-primary"
                onClick={() => setIsHashtagPopoverOpen(!isHashtagPopoverOpen)}
              >
                <Hash size={20} />
              </Button>

              {isHashtagPopoverOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 text-sm">Suggested Hashtags</h4>
                    <button
                      onClick={() => setIsHashtagPopoverOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_HASHTAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => addHashtag(tag)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-600 rounded-full text-sm transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary">
              <AtSign size={20} />
            </Button>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 mx-2" />

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
              className="ml-2 rounded-full bg-[#318D62] hover:bg-[#287350] text-white shadow-md shadow-green-900/20 px-4 h-9 text-sm gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate Caption
                </>
              )}
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

      {/* Bottom Action Bar (Create Mode) */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="text-gray-500 hover:text-gray-900 gap-2">
            {/* 
                BACKEND: Save Draft functionality.
                Call /api/posts/drafts endpoint.
                Store the current state (text, media paths, selected platforms) in the DB.
            */}
            <Save size={18} /> Save Draft
          </Button>
          <div className="text-sm text-gray-500 hidden sm:block">Fill in details to continue</div>
        </div>
      </div>
    </div>
  );
}
