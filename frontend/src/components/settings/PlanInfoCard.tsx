"use client";

import { Button } from "@/components/ui/button";

export const PlanInfoCard = () => {
  return (
    <div className="bg-white rounded-2xl p-6 lg:p-8 h-3/4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Plan Info</h3>
        <span className="text-xs text-gray-400 font-medium">Free tier</span>
      </div>

      {/* Usage Bars */}
      <div className="space-y-8 mb-8">
        {/* Total Generations */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Total Generations Left</h4>
          <div className="relative h-12 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #e5e7eb 10px, #e5e7eb 20px)`,
              }}
            />
            <div
              className="absolute left-0 top-0 h-full bg-[#318D62] rounded-full flex items-center justify-center text-white font-medium text-sm z-10"
              style={{ width: "50%" }}
            >
              5/10
            </div>
          </div>
        </div>

        {/* Total Posts */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Total Posts Left</h4>
          <div className="relative h-12 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #e5e7eb 10px, #e5e7eb 20px)`,
              }}
            />
            <div
              className="absolute left-0 top-0 h-full bg-[#318D62] rounded-full flex items-center justify-center text-white font-medium text-sm z-10"
              style={{ width: "15%" }}
            >
              2/15
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-500 mb-6">
        <div className="flex justify-between w-full sm:w-auto sm:block mb-1 sm:mb-0">
          <span>Started Date</span>
          <span className="ml-0 sm:ml-8 font-medium text-gray-900">11/12/2026</span>
        </div>
        <div className="flex justify-between w-full sm:w-auto sm:block">
          <span>Expiring Date</span>
          <span className="ml-0 sm:ml-8 font-medium text-gray-900">11/01/2027</span>
        </div>
      </div>

      {/* Upgrade Box */}
      <div className="bg-[#318D62] rounded-xl p-6 text-center text-white">
        <p className="text-sm opacity-90 mb-4">
          Enjoy more access than limited and best experience
        </p>
        <Button
          variant="outline"
          className="w-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white rounded-full h-11"
        >
          Upgrade Plan
        </Button>
      </div>
    </div>
  );
};
