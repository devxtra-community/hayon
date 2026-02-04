"use client";

import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlatformPostStatus } from "@/components/history/HistoryCard";
import Image from "next/image";
import { Check, X, ExternalLink, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PostReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    _id: string;
    content: {
      text: string;
      mediaItems: Array<{ s3Url: string }>;
    };
    platformStatuses: PlatformPostStatus[];
    platformSpecificContent?: {
      [key: string]: {
        text?: string;
        mediaItems?: Array<{ s3Url: string }>;
      };
    };
  } | null;
  onRetry: (id: string) => void;
}

export function PostReportModal({ isOpen, onClose, post, onRetry }: PostReportModalProps) {
  if (!post) return null;

  const hasFailures = post.platformStatuses.some((p) => p.status === "failed");

  // Aggregate all unique media items
  const allMedia = useMemo(() => {
    const globalMedia = post.content.mediaItems || [];
    const platformMedia = Object.values(post.platformSpecificContent || {}).flatMap(
      (c) => c.mediaItems || [],
    );

    const combined = [...globalMedia, ...platformMedia];
    // Unique by s3Url
    const unique = Array.from(new Map(combined.map((item) => [item.s3Url, item])).values());
    return unique;
  }, [post]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-[32px] p-6 border-none">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 mb-4">Post Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media Gallery */}
          {allMedia.length > 0 && (
            <div className="flex gap-2 pb-2">
              {allMedia.slice(0, 4).map((media: { s3Url: string }, idx: number) => {
                const isLastSlot = idx === 3;
                const showOverlay = isLastSlot && allMedia.length > 4;
                const remainingCount = allMedia.length - 3;

                return (
                  <div
                    key={idx}
                    className="relative w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <Image
                      src={media.s3Url}
                      alt={`Media ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    {showOverlay && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="text-white font-bold text-sm">+{remainingCount}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-2xl">
            <p className="text-sm text-gray-600 italic line-clamp-3">"{post.content.text}"</p>
          </div>

          <div className="space-y-3">
            {post.platformStatuses.map((p, idx) => (
              <div
                key={p.platform + idx}
                className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden shadow-sm">
                    <Image
                      src={`/images/logos/${p.platform.toLowerCase()}.png`}
                      alt={p.platform}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{p.platform}</p>
                    <div className="flex items-center gap-1">
                      {p.status === "completed" && (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-green-600 flex items-center gap-0.5">
                            <Check size={10} /> Published
                          </span>
                          {p.completedAt && (
                            <span className="text-[9px] text-gray-400">
                              {new Date(p.completedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                      {p.status === "failed" && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-red-600 flex items-center gap-0.5 font-medium">
                            <X size={10} /> Failed
                          </span>
                          {p.error && (
                            <span className="text-[10px] text-red-500 bg-red-50 px-1 py-0.5 rounded-md break-all">
                              {p.error}
                            </span>
                          )}
                          {(p.attemptCount || 0) > 0 && (
                            <span className="text-[9px] text-gray-400">
                              Retry attempt: {p.attemptCount}
                            </span>
                          )}
                        </div>
                      )}
                      {p.status === "processing" && (
                        <span className="text-[10px] text-blue-600 flex items-center gap-0.5 animate-pulse">
                          <Clock size={10} /> Processing
                        </span>
                      )}
                      {p.status === "pending" && (
                        <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                          <Clock size={10} /> Queued
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {p.platformPostUrl && (
                    <a
                      href={p.platformPostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Post"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                  {p.status === "failed" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => onRetry(post._id)}
                      title="Retry this platform"
                    >
                      <RefreshCw size={16} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasFailures && (
            <Button
              className="w-full mt-4 bg-primary hover:bg-primary/90 text-white rounded-2xl py-6 h-auto font-bold flex gap-2"
              onClick={() => onRetry(post._id)}
            >
              <RefreshCw size={18} />
              Retry Failed Platforms
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
