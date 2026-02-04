import { useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface DraftCardProps {
  draftId: string;
  title: string;
  images: string[];
  selectedPlatforms?: string[];
  onEdit: (draftId: string) => void;
  onDelete: (draftId: string) => void;
}

export function DraftCard({
  draftId,
  title,
  images,
  selectedPlatforms = [],
  onEdit,
  onDelete,
}: DraftCardProps) {
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (textRef.current) {
        const { scrollHeight, clientHeight } = textRef.current;
        setIsTruncated(scrollHeight > clientHeight);
      }
    };

    checkTruncation();
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [title]);

  const mainImage = images[0];
  const mediaCount = images.length;

  return (
    <Card className="rounded-[30px] border-none shadow-none overflow-hidden bg-white h-full flex flex-col group transition-all hover:shadow-lg hover:shadow-black/5">
      {/* Image Display */}
      <div className="p-2 relative">
        <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-gray-50 flex items-center justify-center">
          {mainImage ? (
            <>
              <Image src={mainImage} alt="Draft Main" fill className="object-cover" />
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

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between gap-1.5 p-3 pt-0.5">
        <p
          ref={textRef}
          className="text-[#1A1A1A] text-[14px] leading-snug font-medium line-clamp-2"
        >
          {title}
          {isTruncated && (
            <span
              onClick={() => onEdit(draftId)}
              className="text-primary hover:text-primary/80 cursor-pointer text-sm font-medium ml-1"
            >
              read more
            </span>
          )}
        </p>

        <div className="relative mt-2 flex items-end justify-between">
          <button
            onClick={() => onEdit(draftId)}
            className="w-10 h-10 bg-[#2D9F75] rounded-tr-[18px] rounded-bl-[10px] rounded-tl-[10px] rounded-br-[10px] flex items-center justify-center text-white hover:bg-[#23805D] transition-all hover:scale-105 shadow-sm"
          >
            <Pencil size={20} strokeWidth={2.5} />
          </button>

          {/* Selected Platforms - Stacked style */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1 flex items-center">
            {selectedPlatforms.map((platform, idx) => (
              <div
                key={platform + idx}
                className={cn(
                  "relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm hover:z-10 transition-all cursor-default",
                  idx > 0 && "-ml-5",
                )}
                title={platform}
              >
                <Image
                  src={`/images/logos/${platform.toLowerCase()}.png`}
                  alt={platform}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => onDelete(draftId)}
            className="w-10 h-10 bg-red-500 rounded-tl-[18px] rounded-bl-[10px] rounded-tr-[10px] rounded-br-[10px] flex items-center justify-center text-white hover:bg-red-600 transition-all hover:scale-105 shadow-sm"
          >
            <Trash2 size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </Card>
  );
}
