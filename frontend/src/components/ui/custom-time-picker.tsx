"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface CustomTimePickerProps {
  value: string; // "HH:mm" in 24h format
  onChange: (value: string) => void;
}

// Presets in 24h format
const TIME_PRESETS = [
  { label: "9 am", h: 9, m: 0 },
  { label: "12 pm", h: 12, m: 0 },
  { label: "4 pm", h: 16, m: 0 },
  { label: "6 pm", h: 18, m: 0 },
];

function to12Hour(h24: number): { hour: number; period: "AM" | "PM" } {
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  let hour = h24 % 12;
  if (hour === 0) hour = 12;
  return { hour, period };
}

function to24Hour(h12: number, period: "AM" | "PM"): number {
  if (period === "AM") return h12 === 12 ? 0 : h12;
  return h12 === 12 ? 12 : h12 + 12;
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

// Wheel-scroll column for hours, minutes, or AM/PM
function ScrollColumn<T extends string | number>({
  items,
  selectedIndex,
  onSelect,
  renderItem,
  itemHeight = 40,
}: {
  items: T[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  renderItem: (item: T, isSelected: boolean, distance: number) => React.ReactNode;
  itemHeight?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScroll = useRef(0);

  // Visible items above/below = 2
  const visibleAboveBelow = 2;
  const containerHeight = itemHeight * (1 + 2 * visibleAboveBelow);
  const paddingTop = visibleAboveBelow * itemHeight;

  const scrollToIndex = useCallback(
    (index: number, smooth = true) => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: index * itemHeight,
          behavior: smooth ? "smooth" : "instant",
        });
      }
    },
    [itemHeight],
  );

  useEffect(() => {
    scrollToIndex(selectedIndex, false);
  }, [selectedIndex, scrollToIndex]);

  const handleScroll = useCallback(() => {
    if (containerRef.current && !isDragging.current) {
      const scrollTop = containerRef.current.scrollTop;
      const closestIndex = Math.round(scrollTop / itemHeight);
      const clampedIndex = Math.max(0, Math.min(items.length - 1, closestIndex));
      if (clampedIndex !== selectedIndex) {
        onSelect(clampedIndex);
      }
    }
  }, [itemHeight, items.length, onSelect, selectedIndex]);

  // Snap on scroll end
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let timeoutId: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const scrollTop = container.scrollTop;
        const closestIndex = Math.round(scrollTop / itemHeight);
        const clampedIndex = Math.max(0, Math.min(items.length - 1, closestIndex));
        scrollToIndex(clampedIndex, true);
        if (clampedIndex !== selectedIndex) {
          onSelect(clampedIndex);
        }
      }, 80);
    };
    container.addEventListener("scroll", onScroll);
    return () => {
      container.removeEventListener("scroll", onScroll);
      clearTimeout(timeoutId);
    };
  }, [itemHeight, items.length, onSelect, scrollToIndex, selectedIndex]);

  // Touch drag support
  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startY.current = e.touches[0].clientY;
    startScroll.current = containerRef.current?.scrollTop ?? 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const diff = startY.current - e.touches[0].clientY;
    containerRef.current.scrollTop = startScroll.current + diff;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    handleScroll();
  };

  return (
    <div className="relative overflow-hidden select-none" style={{ height: containerHeight }}>
      {/* Selection highlight bar */}
      <div
        className="absolute left-0 right-0 bg-gray-100/80 rounded-xl pointer-events-none z-0 border border-gray-200/50"
        style={{ top: paddingTop, height: itemHeight }}
      />
      <div
        ref={containerRef}
        className="relative z-10 overflow-y-auto scrollbar-hide"
        style={{
          height: containerHeight,
          paddingTop: paddingTop,
          paddingBottom: paddingTop,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, index) => {
          const distance = Math.abs(index - selectedIndex);
          return (
            <div
              key={index}
              className="flex items-center justify-center cursor-pointer transition-all duration-200"
              style={{ height: itemHeight }}
              onClick={() => {
                onSelect(index);
                scrollToIndex(index);
              }}
            >
              {renderItem(item, index === selectedIndex, distance)}
            </div>
          );
        })}
      </div>
      {/* Top and bottom fades */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />
    </div>
  );
}

export function CustomTimePicker({ value, onChange }: CustomTimePickerProps) {
  // Parse initial value
  const [h24, m] = (value || "09:00").split(":").map(Number);
  const { hour: initHour, period: initPeriod } = to12Hour(h24);

  const [selectedHour, setSelectedHour] = useState(initHour);
  const [selectedMinute, setSelectedMinute] = useState(m);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(initPeriod);

  // Sync external value changes
  useEffect(() => {
    const [hh, mm] = (value || "09:00").split(":").map(Number);
    const { hour, period } = to12Hour(hh);
    setSelectedHour(hour);
    setSelectedMinute(mm);
    setSelectedPeriod(period);
  }, [value]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  const minutes = Array.from({ length: 60 }, (_, i) => i); // 0-59
  const periods: ("AM" | "PM")[] = ["AM", "PM"];

  const emitChange = useCallback(
    (h: number, min: number, p: "AM" | "PM") => {
      const h24Val = to24Hour(h, p);
      onChange(`${pad(h24Val)}:${pad(min)}`);
    },
    [onChange],
  );

  const handleHourChange = (index: number) => {
    const h = hours[index];
    setSelectedHour(h);
    emitChange(h, selectedMinute, selectedPeriod);
  };

  const handleMinuteChange = (index: number) => {
    const min = minutes[index];
    setSelectedMinute(min);
    emitChange(selectedHour, min, selectedPeriod);
  };

  const handlePeriodChange = (index: number) => {
    const p = periods[index];
    setSelectedPeriod(p);
    emitChange(selectedHour, selectedMinute, p);
  };

  const handlePreset = (h: number, min: number) => {
    const { hour, period } = to12Hour(h);
    setSelectedHour(hour);
    setSelectedMinute(min);
    setSelectedPeriod(period);
    onChange(`${pad(h)}:${pad(min)}`);
  };

  // Increment / Decrement helpers
  const incrementHour = () => {
    const newH = selectedHour >= 12 ? 1 : selectedHour + 1;
    setSelectedHour(newH);
    emitChange(newH, selectedMinute, selectedPeriod);
  };

  const decrementHour = () => {
    const newH = selectedHour <= 1 ? 12 : selectedHour - 1;
    setSelectedHour(newH);
    emitChange(newH, selectedMinute, selectedPeriod);
  };

  const incrementMinute = () => {
    const newM = selectedMinute >= 59 ? 0 : selectedMinute + 1;
    setSelectedMinute(newM);
    emitChange(selectedHour, newM, selectedPeriod);
  };

  const decrementMinute = () => {
    const newM = selectedMinute <= 0 ? 59 : selectedMinute - 1;
    setSelectedMinute(newM);
    emitChange(selectedHour, newM, selectedPeriod);
  };

  const hourIndex = hours.indexOf(selectedHour);
  const minuteIndex = minutes.indexOf(selectedMinute);
  const periodIndex = periods.indexOf(selectedPeriod);

  return (
    <div className="w-full">
      {/* Scroll Wheels */}
      <div className="flex items-center justify-center gap-0">
        {/* Hour Column with Arrows */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={incrementHour}
            className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
          >
            <ChevronUp size={20} />
          </button>
          <div className="w-[72px]">
            <ScrollColumn
              items={hours}
              selectedIndex={hourIndex >= 0 ? hourIndex : 0}
              onSelect={handleHourChange}
              renderItem={(item, isSelected, distance) => (
                <span
                  className={`text-center transition-all duration-200 font-mono tabular-nums ${
                    isSelected
                      ? "text-2xl font-bold text-gray-900"
                      : distance === 1
                        ? "text-lg text-gray-400 font-medium"
                        : "text-base text-gray-200 font-normal"
                  }`}
                >
                  {item}
                </span>
              )}
            />
          </div>
          <button
            type="button"
            onClick={decrementHour}
            className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* Colon separator */}
        <span className="text-2xl font-bold text-gray-900 mx-1 self-center">:</span>

        {/* Minute Column with Arrows */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={incrementMinute}
            className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
          >
            <ChevronUp size={20} />
          </button>
          <div className="w-[72px]">
            <ScrollColumn
              items={minutes}
              selectedIndex={minuteIndex >= 0 ? minuteIndex : 0}
              onSelect={handleMinuteChange}
              renderItem={(item, isSelected, distance) => (
                <span
                  className={`text-center transition-all duration-200 font-mono tabular-nums ${
                    isSelected
                      ? "text-2xl font-bold text-gray-900"
                      : distance === 1
                        ? "text-lg text-gray-400 font-medium"
                        : "text-base text-gray-200 font-normal"
                  }`}
                >
                  {pad(item as number)}
                </span>
              )}
            />
          </div>
          <button
            type="button"
            onClick={decrementMinute}
            className="w-10 h-10 rounded-full flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
          >
            <ChevronDown size={20} />
          </button>
        </div>

        {/* AM/PM Column */}
        <div className="flex flex-col items-center ml-3">
          <div className="h-10" /> {/* spacer to align with arrow buttons */}
          <div className="w-[72px]">
            <ScrollColumn
              items={periods}
              selectedIndex={periodIndex >= 0 ? periodIndex : 0}
              onSelect={handlePeriodChange}
              renderItem={(item, isSelected) => (
                <span
                  className={`text-center transition-all duration-200 ${
                    isSelected
                      ? "text-xl font-bold text-gray-900"
                      : "text-base text-gray-300 font-medium"
                  }`}
                >
                  {(item as string).toLowerCase()}
                </span>
              )}
            />
          </div>
          <div className="h-10" /> {/* spacer to align with arrow buttons */}
        </div>
      </div>

      {/* Presets */}
      <div className="mt-5">
        <p className="text-xs font-medium text-gray-500 mb-2.5">Presets</p>
        <div className="flex flex-wrap gap-2">
          {TIME_PRESETS.map((preset) => {
            const isActive =
              to24Hour(selectedHour, selectedPeriod) === preset.h && selectedMinute === preset.m;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePreset(preset.h, preset.m)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                  isActive
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                    : "bg-white text-gray-600 border-gray-200 hover:border-primary/40 hover:text-primary"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
