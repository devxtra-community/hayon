import { Check } from "lucide-react";
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
        className="w-full h-14 rounded-full text-lg font-medium bg-gradient-to-r from-gray-900 to-gray-800 hover:from-black hover:to-gray-900 text-white shadow-lg disabled:opacity-50 transition-all"
      >
        {isGenerating ? "Generating..." : "Generate & Preview"}
      </Button>
    </div>
  );
}
