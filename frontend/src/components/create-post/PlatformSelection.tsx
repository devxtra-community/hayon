import { Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Platform } from "@/types/create-post";
import { Button } from "@/components/ui/button";

interface PlatformSelectionProps {
  availablePlatforms: Platform[];
  selectedPlatforms: string[];
  onToggle: (id: string, connected: boolean) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  canGenerate: boolean;
}

export function PlatformSelection({
  availablePlatforms,
  selectedPlatforms,
  onToggle,
  isGenerating,
  onGenerate,
  canGenerate,
}: PlatformSelectionProps) {
  return (
    <div className="flex flex-col gap-6 w-full lg:w-[400px]">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Select Platforms</h3>
        {availablePlatforms.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {availablePlatforms.map((platform) => (
              <div
                key={platform.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-2xl transition-all border",
                  platform.connected
                    ? "cursor-pointer hover:bg-gray-50 bg-white"
                    : "opacity-60 cursor-not-allowed bg-gray-50",
                  selectedPlatforms.includes(platform.id)
                    ? "bg-gray-50 border-primary/20 shadow-sm"
                    : "border-transparent",
                )}
                onClick={() => onToggle(platform.id, platform.connected)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm",
                      platform.color,
                    )}
                  >
                    {platform.icon}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{platform.name}</div>
                    <div
                      className={cn(
                        "text-xs",
                        platform.connected ? "text-green-500" : "text-gray-400",
                      )}
                    >
                      {platform.connected ? "Connected" : "Not Connected"}
                    </div>
                  </div>
                </div>
                {platform.connected && (
                  <div
                    className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center transition-colors border",
                      selectedPlatforms.includes(platform.id)
                        ? "bg-primary border-primary text-white"
                        : "border-gray-200 bg-white",
                    )}
                  >
                    {selectedPlatforms.includes(platform.id) && <Check size={14} strokeWidth={3} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={onGenerate}
        disabled={isGenerating || availablePlatforms.length === 0 || !canGenerate}
        className="w-full h-14 rounded-full text-lg font-semibold bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-900 text-white shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.6)] disabled:opacity-50 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#318D62]/0 via-[#318D62]/10 to-[#318D62]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        <span className="relative flex items-center justify-center gap-2">
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Generating...
            </>
          ) : (
            <>
              Generate & Preview
              <Sparkles className="text-emerald-400 group-hover:animate-pulse" size={20} />
            </>
          )}
        </span>
      </Button>
    </div>
  );
}
