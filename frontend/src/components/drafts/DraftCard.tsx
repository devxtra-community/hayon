import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Image from "next/image";

interface DraftCardProps {
  title: string;
  images: string[];
}

export function DraftCard({ title, images }: DraftCardProps) {
  return (
    <Card className="rounded-[30px] border-none shadow-none overflow-hidden bg-white h-full flex flex-col p-4">
      {/* Image Grid */}
      <div className="flex gap-2 h-48 mb-4">
        {/* Large Main Image */}
        <div className="relative w-2/3 h-full rounded-[20px] overflow-hidden">
          <Image src={images[0]} alt="Draft Main" fill className="object-cover" />
        </div>
        {/* Stacked Small Images */}
        <div className="flex flex-col gap-2 w-1/3 h-full">
          <div className="relative h-1/2 rounded-[20px] overflow-hidden">
            {images[1] && <Image src={images[1]} alt="Draft Sub 1" fill className="object-cover" />}
          </div>
          <div className="relative h-1/2 rounded-[20px] overflow-hidden">
            {images[2] && <Image src={images[2]} alt="Draft Sub 2" fill className="object-cover" />}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-2 mb-4">
        <p className="text-[#1A1A1A] text-[16px] leading-snug font-normal line-clamp-2">
          {title} <span className="text-gray-400 cursor-pointer text-sm ml-1">read more</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-auto">
        <button className="w-12 h-12 bg-[#2D9F75] rounded-tr-[24px] rounded-bl-[12px] rounded-tl-[12px] rounded-br-[12px] flex items-center justify-center text-white hover:bg-[#23805D] transition-colors shadow-sm">
          <Pencil size={24} strokeWidth={2} className="relative left-[1px] bottom-[1px]" />
        </button>

        <div className="flex gap-3">
          <Button className="rounded-full bg-[#65B990] hover:bg-[#529C78] text-white font-bold px-6 h-10 border-none shadow-none text-md">
            Schedule
          </Button>
          <Button className="rounded-full bg-[#2D9F75] hover:bg-[#23805D] text-white font-bold px-6 h-10 border-none shadow-none text-md">
            Post Now
          </Button>
        </div>
      </div>
    </Card>
  );
}
