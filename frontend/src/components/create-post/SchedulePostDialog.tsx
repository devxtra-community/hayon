"use client";

import React from "react";
import { Globe, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";
import { CustomTimePicker } from "@/components/ui/custom-time-picker";

interface SchedulePostDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  filePreviews: string[];
  postText: string;
  timeZone: string;
  scheduleDate: string;
  setScheduleDate: (date: string) => void;
  scheduleTime: string;
  setScheduleTime: (time: string) => void;
  onConfirm: () => void;
}

export const SchedulePostDialog: React.FC<SchedulePostDialogProps> = ({
  isOpen,
  onOpenChange,
  timeZone,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[850px] p-0 overflow-hidden bg-white rounded-[2rem] md:rounded-[2.5rem] border-none shadow-2xl">
        <DialogTitle className="sr-only">Schedule your post</DialogTitle>
        <DialogDescription className="sr-only">
          Select a date and time to publish your post on social media.
        </DialogDescription>
        <div className="flex flex-col md:flex-row h-full max-h-[85vh] md:max-h-none md:min-h-[520px] overflow-y-auto md:overflow-visible">
          {/* Left Section: Date Selection */}
          <div className="flex-1 p-6 md:p-8 bg-gray-50/50 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-center">
            <div className="mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-3">
                <CalendarIcon size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Choose Date</h2>
              <p className="text-gray-500 text-xs mt-1">Pick the best day for your content.</p>
            </div>

            <CustomDatePicker value={scheduleDate} onChange={setScheduleDate} />

            <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                <Globe size={16} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Current Timezone
                </p>
                <p className="text-sm font-semibold text-gray-700">{timeZone}</p>
              </div>
            </div>
          </div>

          {/* Right Section: Time Selection */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
            <div className="mb-6">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-3">
                <Clock size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Choose Time</h2>
              <p className="text-gray-500 text-xs mt-1">Select the exact hour and minute.</p>
            </div>

            <div className="flex justify-center">
              <CustomTimePicker value={scheduleTime} onChange={setScheduleTime} />
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button
                onClick={onConfirm}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Schedule Post
              </Button>
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="w-full h-12 rounded-xl text-gray-500 hover:text-gray-700 font-medium"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
