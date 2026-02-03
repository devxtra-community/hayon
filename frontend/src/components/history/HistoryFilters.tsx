"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

export type FilterState = {
  statuses: string[];
  platforms: string[];
  dateRange: string;
};

interface HistoryFiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  sort: string;
  setSort: (sort: string) => void;
}

const ALL_PLATFORMS = ["Bluesky", "Mastodon", "Instagram", "Facebook", "Threads", "Tumblr"];
const ALL_STATUSES = ["COMPLETED", "PARTIAL_SUCCESS", "FAILED", "PROCESSING"];

export function HistoryFilters({ filters, setFilters, sort, setSort }: HistoryFiltersProps) {
  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatuses = checked
      ? [...filters.statuses, status]
      : filters.statuses.filter((s) => s !== status);
    setFilters({ ...filters, statuses: newStatuses });
  };

  const handlePlatformChange = (platform: string, checked: boolean) => {
    const newPlatforms = checked
      ? [...filters.platforms, platform]
      : filters.platforms.filter((p) => p !== platform);
    setFilters({ ...filters, platforms: newPlatforms });
  };

  const clearFilters = () => {
    setFilters({ statuses: [], platforms: [], dateRange: "all" });
    setSort("newest");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="ml-4 w-[44px] h-[44px] bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors">
          <Filter size={20} className="text-black" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium leading-none">Filters</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-gray-500 hover:text-black"
              onClick={clearFilters}
            >
              Clear
            </Button>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-500">Sort By</h5>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger>
                <SelectValue placeholder="Select order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="scheduled_asc">Scheduled (Earliest)</SelectItem>
                <SelectItem value="scheduled_desc">Scheduled (Latest)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-500">Status</h5>
            <div className="grid grid-cols-2 gap-2">
              {ALL_STATUSES.map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.statuses.includes(status)}
                    onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                  />
                  <Label
                    htmlFor={`status-${status}`}
                    className="text-sm font-normal capitalize cursor-pointer"
                  >
                    {status.toLowerCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-500">Platform</h5>
            <div className="grid grid-cols-2 gap-2">
              {ALL_PLATFORMS.map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={`platform-${platform}`}
                    checked={filters.platforms.includes(platform)}
                    onCheckedChange={(checked) =>
                      handlePlatformChange(platform, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`platform-${platform}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
