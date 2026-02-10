"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Platform } from "@/types/create-post";
import { LoadingH } from "../ui/loading-h";

interface SubmittingOverlayProps {
  selectedPlatformIds: string[];
  availablePlatforms: Platform[];
  isSubmitting: boolean;
}

export function SubmittingOverlay({
  selectedPlatformIds,
  availablePlatforms,
  isSubmitting,
}: SubmittingOverlayProps) {
  const [currentPlatformIndex, setCurrentPlatformIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const selectedPlatforms = availablePlatforms.filter((p) => selectedPlatformIds.includes(p.id));

  useEffect(() => {
    if (!isSubmitting || selectedPlatforms.length === 0) {
      setCurrentPlatformIndex(0);
      setProgress(0);
      return;
    }

    const intervalMs = 50; // Update every 50ms for smooth progress
    const msPerPlatform = 3000;
    const increment = 100 / (msPerPlatform / intervalMs);

    const intervalId = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          if (currentPlatformIndex < selectedPlatforms.length - 1) {
            setCurrentPlatformIndex((idx) => idx + 1);
            return 0;
          }
          return 100;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [isSubmitting, currentPlatformIndex, selectedPlatforms.length]);

  if (!isSubmitting) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-white/70 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-4xl aspect-video md:aspect-[16/10] bg-[#BDEDD2] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row p-6 md:p-10 gap-6 md:gap-10"
      >
        {/* Left Side: White Card with Progress */}
        <div className="flex-[1.4] bg-white rounded-[2.5rem] p-2 md:p-12 flex flex-col justify-center gap-2 md:gap-10 shadow-sm">
          <div className="space-y-8">
            {selectedPlatforms.map((platform, index) => {
              const isCompleted = index < currentPlatformIndex;
              const isProcessing = index === currentPlatformIndex;
              const currentProgress = isCompleted ? 100 : isProcessing ? progress : 0;

              return (
                <div key={platform.id} className="flex items-center gap-6 group">
                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center transition-all duration-500 ${
                      !isCompleted && !isProcessing
                        ? "grayscale opacity-20 scale-90"
                        : "scale-100 shadow-lg"
                    }`}
                  >
                    <div className="w-full h-full p-0.5">{platform.icon}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span
                        className={`text-sm font-semibold transition-colors duration-500 ${
                          isProcessing || isCompleted ? "text-gray-800" : "text-gray-300"
                        }`}
                      >
                        {platform.name}
                      </span>
                      {(isProcessing || isCompleted) && (
                        <span className="text-[10px] font-bold text-[#108548] uppercase tracking-wider">
                          {isCompleted ? "Completed" : `${Math.round(currentProgress)}%`}
                        </span>
                      )}
                    </div>
                    <div className="h-2.5 md:h-3 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${currentProgress}%` }}
                        transition={{ duration: 0.1, ease: "linear" }}
                        className="h-full bg-[#108548] rounded-full shadow-[0_0_10px_rgba(16,133,72,0.3)]"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Message and Status */}
        <div className="flex-1 flex flex-col items-center justify-between py-2 ">
          <div className="w-full aspect-square md:aspect-[4/5] bg-white/50 rounded-[2.5rem] flex items-center justify-center overflow-hidden border border-white/20 backdrop-blur-sm relative group">
            <LoadingH />
          </div>
          <div className="text-center mt-6 md:mt-0">
            <p className="text-[#108548] font-bold text-xl md:text-2xl leading-tight tracking-tight">
              it will only take seconds
              <br />
              <span className="opacity-80 font-medium text-lg md:text-xl">please be patient</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
