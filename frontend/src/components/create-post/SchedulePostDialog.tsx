import React from "react";
import Image from "next/image";
import { Calendar, Globe, Clock, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  filePreviews,
  postText,
  timeZone,
  scheduleDate,
  setScheduleDate,
  scheduleTime,
  setScheduleTime,
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-white rounded-3xl">
        <div className="flex flex-col md:flex-row h-[500px]">
          {/* Left: Preview */}
          <div className="bg-gray-100 w-full md:w-5/12 relative hidden md:block">
            {filePreviews[0] ? (
              <Image src={filePreviews[0]} alt="Scheduled Post" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <ImageIcon size={48} />
                <p className="absolute mt-20 text-sm">No media selected</p>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
              <p className="text-white font-medium line-clamp-3 text-sm">
                {postText || "No caption provided..."}
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="flex-1 p-8 flex flex-col">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold">Schedule Post</DialogTitle>
              <p className="text-gray-500 text-sm">Choose the best time for your audience.</p>
            </DialogHeader>

            <div className="space-y-6 flex-1">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                <span className="text-sm font-medium text-gray-600">Time Zone</span>
                <span className="text-sm text-gray-900 font-semibold flex items-center gap-2">
                  <Globe size={14} /> {timeZone}
                </span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <div className="relative">
                    <Calendar
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <Input
                      id="date"
                      type="date"
                      className="pl-10"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <div className="relative">
                    <Clock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <Input
                      id="time"
                      type="time"
                      className="pl-10"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={onConfirm} className="bg-primary hover:bg-primary/90">
                Schedule
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
