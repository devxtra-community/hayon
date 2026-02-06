"use client";

import { Button } from "@/components/ui/button";
import { UserSubscription, UserUsage, UserLimits } from "@/types/user.types";

interface PlanInfoCardProps {
  user?: {
    subscription?: UserSubscription;
    usage?: UserUsage;
    limits?: UserLimits;
  };
}

export const PlanInfoCard = ({ user }: PlanInfoCardProps) => {
  // Extract user data with defaults
  const subscription = user?.subscription;
  const usage = user?.usage || { captionGenerations: 0, postsCreated: 0 };
  const limits = user?.limits || { maxCaptionGenerations: 10, maxPosts: 30 };

  // Calculate remaining usage
  const generationsUsed = usage.captionGenerations;
  const generationsLimit = limits.maxCaptionGenerations;
  const generationsLeft = generationsLimit - generationsUsed;
  const generationsPercentage = (generationsUsed / generationsLimit) * 100;

  const postsUsed = usage.postsCreated;
  const postsLimit = limits.maxPosts;
  const postsLeft = postsLimit - postsUsed;
  const postsPercentage = (postsUsed / postsLimit) * 100;

  // Format dates
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Determine plan display
  const planName = subscription?.plan === "pro" ? "Pro" : "Free tier";
  const isPro = subscription?.plan === "pro";

  return (
    <div className="bg-white rounded-2xl p-6 lg:p-8 h-3/4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Plan Info</h3>
        <span className={`text-xs font-medium ${isPro ? "text-[#318D62]" : "text-gray-400"}`}>
          {planName}
        </span>
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
              className="absolute left-0 top-0 h-full bg-[#318D62] rounded-full flex items-center justify-center text-white font-medium text-sm z-10 transition-all duration-300"
              style={{
                width: `${Math.max(generationsPercentage, 10)}%`,
                minWidth: generationsPercentage > 0 ? "50px" : "0px",
              }}
            >
              {generationsUsed}/{generationsLimit}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {generationsLeft} generation{generationsLeft !== 1 ? "s" : ""} remaining
          </p>
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
              className="absolute left-0 top-0 h-full bg-[#318D62] rounded-full flex items-center justify-center text-white font-medium text-sm z-10 transition-all duration-300"
              style={{
                width: `${Math.max(postsPercentage, 10)}%`,
                minWidth: postsPercentage > 0 ? "50px" : "0px",
              }}
            >
              {postsUsed}/{postsLimit}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {postsLeft} post{postsLeft !== 1 ? "s" : ""} remaining
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-500 mb-6">
        <div className="flex justify-between w-full sm:w-auto sm:block mb-1 sm:mb-0">
          <span>Started Date</span>
          <span className="ml-0 sm:ml-8 font-medium text-gray-900">
            {formatDate(subscription?.currentPeriodStart)}
          </span>
        </div>
        <div className="flex justify-between w-full sm:w-auto sm:block">
          <span>Expiring Date</span>
          <span className="ml-0 sm:ml-8 font-medium text-gray-900">
            {formatDate(subscription?.currentPeriodEnd)}
          </span>
        </div>
      </div>

      {/* Upgrade Box - Only show for free tier users */}
      {!isPro && (
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
      )}

      {/* Pro Plan Status */}
      {isPro && (
        <div className="bg-gradient-to-r from-[#318D62] to-[#2a7a54] rounded-xl p-6 text-center text-white">
          <p className="text-sm opacity-90 mb-2 font-medium">✨ You're on the Pro Plan</p>
          <p className="text-xs opacity-75">
            {subscription?.cancelAtPeriodEnd
              ? "Your subscription will end on the expiring date"
              : "Enjoy unlimited access to premium features"}
          </p>
        </div>
      )}
    </div>
  );
};
