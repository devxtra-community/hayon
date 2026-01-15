"use client";

export default function PlatformPerformanceCard() {
  return (
    <div className="bg-white rounded-2xl p-6">
      <h3 className="text-base font-medium text-gray-900 mb-8">Platform performance</h3>

      <div className="flex items-center gap-8 pl-4">
        {/* Pie Chart */}
        <div
          className="w-40 h-40 rounded-full shadow-inner"
          style={{
            background: `conic-gradient(
                            #318D62 0% 65%, 
                            #86efac 65% 85%,  
                            #d1fae5 85% 100%
                        )`,
          }}
        />

        {/* Legend */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#318D62]" />
            <span className="text-sm text-gray-600 font-medium">Instagram</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#86efac]" />
            <span className="text-sm text-gray-600 font-medium">Bluesky</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#d1fae5]" />
            <span className="text-sm text-gray-600 font-medium">Reddit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
