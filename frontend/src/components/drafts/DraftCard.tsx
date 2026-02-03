import { useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { PreviewImage } from "@/components/create-post/PreviewImage";

interface DraftCardProps {
  draftId: string;
  title: string;
  images: string[];
  onEdit: (draftId: string) => void;
  onDelete: (draftId: string) => void;
  onPost: (draftId: string) => void;
}

export function DraftCard({ draftId, title, images, onEdit, onDelete, onPost }: DraftCardProps) {
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
    // Re-check on window resize
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [title]);

  return (
    <Card className="rounded-[30px] border-none shadow-none overflow-hidden bg-white h-full flex flex-col p-4">
      {/* Image Grid */}
      <div className="flex gap-2 h-48 mb-4">
        {/* Large Main Image */}
        <div className="relative w-2/3 h-full rounded-[20px] overflow-hidden">
          {images[0] ? (
            <PreviewImage src={images[0]} alt="Draft Main" />
          ) : (
            <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
              No Media
            </div>
          )}
        </div>
        {/* Stacked Small Images */}
        <div className="flex flex-col gap-2 w-1/3 h-full">
          <div className="relative h-1/2 rounded-[20px] overflow-hidden">
            {images[1] ? (
              <PreviewImage src={images[1]} alt="Draft Sub 1" />
            ) : (
              <div className="w-full h-full bg-gray-50" />
            )}
          </div>
          <div className="relative h-1/2 rounded-[20px] overflow-hidden">
            {images[2] ? (
              <PreviewImage src={images[2]} alt="Draft Sub 2" />
            ) : (
              <div className="w-full h-full bg-gray-50" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-2 mb-4">
        <p
          ref={textRef}
          className="text-[#1A1A1A] text-[16px] leading-snug font-normal line-clamp-2"
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
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-auto">
        <button
          onClick={() => onEdit(draftId)}
          className="w-12 h-12 bg-[#2D9F75] rounded-tr-[24px] rounded-bl-[12px] rounded-tl-[12px] rounded-br-[12px] flex items-center justify-center text-white hover:bg-[#23805D] transition-colors shadow-sm"
        >
          <Pencil size={24} strokeWidth={2} className="relative left-[1px] bottom-[1px]" />
        </button>

        <Button
          onClick={() => onPost(draftId)}
          className="rounded-full bg-[#2D9F75] hover:bg-[#23805D] text-white font-bold px-8 h-12 border-none shadow-none text-md"
        >
          Post Now
        </Button>

        <button
          onClick={() => onDelete(draftId)}
          className="w-12 h-12 bg-red-500 rounded-tl-[24px] rounded-bl-[12px] rounded-tr-[12px] rounded-br-[12px] flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-sm"
        >
          <Trash2 size={24} strokeWidth={2} className="relative right-[1px] bottom-[1px]" />
        </button>
      </div>
    </Card>
  );
}
