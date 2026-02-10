"use client";

import React, { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

export function CustomDatePicker({ value, onChange }: CustomDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const selectedDate = value ? new Date(value) : new Date();

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }, [currentMonth]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-base font-bold text-gray-800">{format(currentMonth, "MMMM yyyy")}</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {/* Day Names Row */}
        <div className="grid grid-cols-7 mb-1">
          {dayNames.map((name) => (
            <span
              key={name}
              className="text-center text-[10px] uppercase font-bold text-gray-400 tracking-wider"
            >
              {name.substring(0, 1)}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <motion.button
                key={day.toString()}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange(format(day, "yyyy-MM-dd"))}
                className={`relative flex items-center justify-center aspect-square w-full rounded-lg transition-all duration-200 text-sm ${
                  isSelected
                    ? "bg-primary text-white font-bold shadow-md shadow-primary/20"
                    : !isCurrentMonth
                      ? "text-gray-300 pointer-events-none opacity-0" // Hide days from other months for cleaner look, or just dim them
                      : isToday
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-gray-100 text-gray-600"
                } ${!isCurrentMonth ? "invisible" : "visible"}`}
              >
                {format(day, "d")}
                {isSelected && (
                  <motion.div
                    layoutId="activeDay"
                    className="absolute inset-0 border-2 border-primary rounded-lg"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
