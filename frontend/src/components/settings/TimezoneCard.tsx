"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/axios";
import { cn } from "@/lib/utils";

interface TimezoneCardProps {
  initialTimezone?: string;
  onUpdate: () => void;
}

export const TimezoneCard: React.FC<TimezoneCardProps> = ({ initialTimezone, onUpdate }) => {
  const [isChangingTimezone, setIsChangingTimezone] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const [selectedTimezone, setSelectedTimezone] = useState("");
  const [isUpdatingTimezone, setIsUpdatingTimezone] = useState(false);
  const allTimezones = useRef<string[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    try {
      allTimezones.current = Intl.supportedValuesOf("timeZone");
    } catch (e) {
      allTimezones.current = [];
      console.log(e);
    }
  }, []);

  const handleTimezoneUpdate = async () => {
    if (!selectedTimezone) return;

    setIsUpdatingTimezone(true);
    try {
      await api.put("/profile/change-timezone", {
        timezone: selectedTimezone,
      });
      showToast(
        "success",
        "Timezone Updated",
        `Your timezone has been changed to ${selectedTimezone}`,
      );
      onUpdate();
      setIsChangingTimezone(false);
    } catch (error) {
      console.error("Failed to update timezone", error);
      showToast("error", "Update Failed", "Could not update timezone. Please try again.");
    } finally {
      setIsUpdatingTimezone(false);
    }
  };

  const getTimezoneLabel = (tz: string) => {
    const labels: Record<string, string> = {
      "Asia/Kolkata": "🇮🇳 India (Kolkata)",
      "Asia/Dubai": "🇦🇪 Dubai, UAE",
      "Asia/Karachi": "🇵🇰 Karachi, Pakistan",
      "Asia/Dhaka": "🇧🇩 Dhaka, Bangladesh",
      "Asia/Singapore": "🇸🇬 Singapore",
      "Asia/Bangkok": "🇹🇭 Bangkok, Thailand",
      "Asia/Jakarta": "🇮🇩 Jakarta, Indonesia",
      "Asia/Manila": "🇵🇭 Manila, Philippines",
      "Asia/Hong_Kong": "🇭🇰 Hong Kong",
      "Asia/Shanghai": "🇨🇳 Shanghai, China",
      "Asia/Seoul": "🇰🇷 Seoul, Korea",
      "Asia/Tokyo": "🇯🇵 Tokyo, Japan",
      "Asia/Riyadh": "🇸🇦 Riyadh, Saudi Arabia",
      "Asia/Jerusalem": "🇮🇱 Jerusalem",
      "Europe/London": "🇬🇧 London, UK",
      "Europe/Dublin": "🇮🇪 Dublin, Ireland",
      "Europe/Paris": "🇫🇷 Paris, France",
      "Europe/Berlin": "🇩🇪 Berlin, Germany",
      "Europe/Rome": "🇮🇹 Rome, Italy",
      "Europe/Madrid": "🇪🇸 Madrid, Spain",
      "Europe/Amsterdam": "🇳🇱 Amsterdam",
      "Europe/Zurich": "🇨🇭 Zurich, Switzerland",
      "Europe/Stockholm": "🇸🇪 Stockholm",
      "Europe/Athens": "🇬🇷 Athens, Greece",
      "Europe/Istanbul": "🇹🇷 Istanbul, Turkey",
      "Europe/Moscow": "🇷🇺 Moscow, Russia",
      "Europe/Lisbon": "🇵🇹 Lisbon, Portugal",
      UTC: "🌐 UTC (Universal)",
    };
    return labels[tz] || tz;
  };

  const timeZones = [
    // 🌏 Asia
    "Asia/Kolkata",
    "Asia/Dubai",
    "Asia/Karachi",
    "Asia/Dhaka",
    "Asia/Singapore",
    "Asia/Bangkok",
    "Asia/Jakarta",
    "Asia/Manila",
    "Asia/Hong_Kong",
    "Asia/Shanghai",
    "Asia/Seoul",
    "Asia/Tokyo",
    "Asia/Riyadh",
    "Asia/Jerusalem",

    // 🌍 Europe
    "Europe/London",
    "Europe/Dublin",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Rome",
    "Europe/Madrid",
    "Europe/Amsterdam",
    "Europe/Zurich",
    "Europe/Stockholm",
    "Europe/Athens",
    "Europe/Istanbul",
    "Europe/Moscow",
    "Europe/Lisbon",
  ];

  const filteredTimezones = allTimezones.current.filter((tz) =>
    tz.toLowerCase().includes(timezoneSearch.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-2xl p-6 lg:p-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">Time Zone</h3>
          <p className="text-lg font-medium text-gray-900">
            {initialTimezone || "Not set (Default: UTC)"}
          </p>
        </div>
        <Button
          onClick={() => {
            setIsChangingTimezone(!isChangingTimezone);
            if (!isChangingTimezone && initialTimezone) {
              setSelectedTimezone(initialTimezone);
            }
          }}
          className="bg-[#318D62] hover:bg-[#287350] text-white rounded-full px-6"
          disabled={isUpdatingTimezone}
        >
          {isChangingTimezone ? "Cancel" : "Change"}
        </Button>
      </div>

      {isChangingTimezone && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search timezone..."
              value={timezoneSearch}
              onChange={(e) => setTimezoneSearch(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#318D62]/20"
            />
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-white scrollbar-hide">
            {/* Suggested Timezones when not searching */}
            {!timezoneSearch && (
              <div className="border-b border-gray-50 mb-2">
                <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Quick Selection
                </p>
                {timeZones.map((tz) => (
                  <button
                    key={`suggested-${tz}`}
                    onClick={() => setSelectedTimezone(tz)}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50",
                      selectedTimezone === tz
                        ? "bg-[#318D62]/10 text-[#318D62] font-semibold"
                        : "text-gray-700",
                    )}
                  >
                    {getTimezoneLabel(tz)}
                  </button>
                ))}
                <div className="h-2 bg-gray-50/50 my-1"></div>
                <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Full Database
                </p>
              </div>
            )}

            {filteredTimezones.length > 0 ? (
              filteredTimezones.map((tz) => (
                <button
                  key={tz}
                  onClick={() => setSelectedTimezone(tz)}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50",
                    selectedTimezone === tz
                      ? "bg-[#318D62]/10 text-[#318D62] font-semibold"
                      : "text-gray-700",
                  )}
                >
                  {getTimezoneLabel(tz)}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">No timezones found</div>
            )}
          </div>

          <Button
            onClick={handleTimezoneUpdate}
            disabled={
              isUpdatingTimezone || !selectedTimezone || selectedTimezone === initialTimezone
            }
            className="w-full bg-[#318D62] hover:bg-[#287350] text-white rounded-xl h-11"
          >
            {isUpdatingTimezone ? "Confirming..." : "Confirm Timezone"}
          </Button>
        </div>
      )}
    </div>
  );
};
