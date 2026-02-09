import { Card } from "@/components/ui/card";
import { MoreVertical, Check, AlertCircle, Eye, RefreshCw, Loader2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface PlatformPostStatus {
  platform: string;
  status: "pending" | "processing" | "completed" | "failed";
  platformPostId?: string;
  platformPostUrl?: string;
  error?: string;
  completedAt?: string;
  lastAttemptAt?: string;
  attemptCount?: number;
}

interface HistoryCardProps {
  id: string;
  imageUrl: string;
  description: string;
  status:
    | "DRAFT"
    | "PENDING"
    | "SCHEDULED"
    | "PROCESSING"
    | "COMPLETED"
    | "PARTIAL_SUCCESS"
    | "FAILED";
  platformStatuses?: PlatformPostStatus[];
  mediaCount?: number;
  createdAt?: string;
  onActionClick?: (id: string, action: string) => void;
}

export function HistoryCard({
  id,
  imageUrl,
  description,
  status = "COMPLETED",
  platformStatuses = [],
  mediaCount = 1,
  createdAt,
  onActionClick,
}: HistoryCardProps) {
  const isRetryable = status === "FAILED" || status === "PARTIAL_SUCCESS";
  // const hasFailures = platformStatuses.some((p) => p.status === "failed");

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })
    : "";

  return (
    <Card
      className={cn(
        "rounded-[30px] border-none shadow-none overflow-hidden h-full flex flex-col group transition-all hover:shadow-lg hover:shadow-black/5 cursor-pointer",
        // hasFailures ? "bg-red-50" : "bg-white"
      )}
      onClick={() => onActionClick?.(id, "detail")}
    >
      <div className="p-2 relative">
        <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-gray-50 flex items-center justify-center">
          {imageUrl ? (
            <>
              <Image src={imageUrl} alt="History Item" fill className="object-cover" />
              {/* Multi-Media Badge */}
              {mediaCount > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
                  <span className="text-[10px] font-bold text-white">+{mediaCount - 1}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 opacity-20">
              <div className="p-3 rounded-full bg-gray-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-file-text"
                >
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  <path d="M10 9H8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                </svg>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Text Only</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between gap-1.5 p-3 pt-0.5">
        <p className="text-[#1A1A1A] text-[14px] leading-snug font-medium line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between mt-1">
          {/* Platform Status Icons */}
          <div className="flex gap-2.5">
            {platformStatuses.map((p, idx) => (
              <div
                key={p.platform + idx}
                className="relative w-8 h-8"
                title={`${p.platform}: ${p.status}`}
              >
                <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center shadow-sm">
                  <Image
                    src={`/images/platform-logos/${p.platform.toLowerCase()}.png`}
                    alt={p.platform}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Micro Status Indicator - Positioned outside with white ring */}
                {p.status === "completed" && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 ring-2 ring-white">
                    <Check size={8} strokeWidth={4} />
                  </div>
                )}
                {p.status === "failed" && (
                  <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-0.5 ring-2 ring-white">
                    <AlertCircle size={8} strokeWidth={4} />
                  </div>
                )}
                {(p.status === "processing" || p.status === "pending") && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 ring-2 ring-white">
                    <Loader2 size={8} strokeWidth={4} className="animate-spin" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Menu Icon with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-primary hover:bg-primary/5 transition-all outline-none"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white rounded-2xl p-2 border-none shadow-xl shadow-black/5"
            >
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onActionClick?.(id, "view");
                }}
                className="flex items-center gap-2 rounded-xl focus:bg-primary/5 focus:text-primary cursor-pointer p-3"
              >
                <Eye size={18} />
                <span className="font-medium">View Report</span>
              </DropdownMenuItem>

              {isRetryable && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onActionClick?.(id, "retry");
                  }}
                  className="flex items-center gap-2 rounded-xl focus:bg-primary/5 focus:text-primary cursor-pointer p-3"
                >
                  <RefreshCw size={18} />
                  <span className="font-medium">Retry Failed</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Date Display */}
        {formattedDate && (
          <span className="text-[10px] text-gray-400 font-medium ml-1">{formattedDate}</span>
        )}
      </div>
    </Card>
  );
}
