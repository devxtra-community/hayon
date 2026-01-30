import { Card } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import Image from "next/image";

interface HistoryCardProps {
  imageUrl: string;
  description: string;
  status?: "DRAFT" | "PENDING" | "SCHEDULED" | "PROCESSING" | "COMPLETED" | "FAILED";
}

const statusColors = {
  DRAFT: "bg-gray-400",
  PENDING: "bg-yellow-400",
  SCHEDULED: "bg-blue-400",
  PROCESSING: "bg-purple-400",
  COMPLETED: "bg-green-400",
  FAILED: "bg-red-400",
};

export function HistoryCard({ imageUrl, description, status = "COMPLETED" }: HistoryCardProps) {
  return (
    <Card className="rounded-[30px] border-none shadow-none overflow-hidden bg-white h-full flex flex-col">
      <div className="p-2.5 relative">
        <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden">
          <Image src={imageUrl} alt="History Item" fill className="object-cover" />
        </div>
        {/* Status Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
          <div className={`w-2 h-2 rounded-full ${statusColors[status] || "bg-gray-400"}`} />
          <span className="text-[10px] font-medium text-gray-700 uppercase tracking-wide">
            {status}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-between gap-2">
        <p className="text-[#1A1A1A] text-[16px] leading-snug font-normal pl-4 pr-4">
          {description}
        </p>

        <div className="flex items-end justify-between mt-2 pl-4 pr-4 pb-4">
          {/* Three gray circles */}
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-[#E0E0E0]"></div>
            <div className="w-8 h-8 rounded-full bg-[#E0E0E0]"></div>
            <div className="w-8 h-8 rounded-full bg-[#E0E0E0]"></div>
          </div>

          {/* Menu Icon */}
          <button className="text-[#2F5B4C] hover:text-[#234539] transition-colors mb-1">
            <MoreVertical size={24} />
          </button>
        </div>
      </div>
    </Card>
  );
}
