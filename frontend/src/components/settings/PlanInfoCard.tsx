"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserSubscription, UserUsage, UserLimits } from "@/types/user.types";
import { paymentService } from "@/services/payment.service";

interface PlanInfoCardProps {
  user?: {
    subscription?: UserSubscription;
    usage?: UserUsage;
    limits?: UserLimits;
  };
}

export const PlanInfoCard = ({ user }: PlanInfoCardProps) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const subscription = user?.subscription;
  const usage = user?.usage || { captionGenerations: 0, postsCreated: 0 };
  const limits = user?.limits || { maxCaptionGenerations: 50, maxPosts: 30 };

  const generationsUsed = usage.captionGenerations;
  const generationsLimit = limits.maxCaptionGenerations;
  const generationsLeft = Math.max(0, generationsLimit - generationsUsed);
  const generationsPercentage = Math.min((generationsUsed / generationsLimit) * 100, 100);

  const postsUsed = usage.postsCreated;
  const postsLimit = limits.maxPosts;
  const postsLeft = Math.max(0, postsLimit - postsUsed);
  const postsPercentage = Math.min((postsUsed / postsLimit) * 100, 100);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isPro = subscription?.plan === "pro";
  const isPastDue = subscription?.status === "pastDue";
  const isCancelScheduled = subscription?.cancelAtPeriodEnd === true;

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const url = await paymentService.createCheckoutSession();
      if (url) window.location.href = url;
    } catch {
      alert("Failed to start upgrade. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleBillingPortal = async () => {
    try {
      setIsOpeningPortal(true);
      const url = await paymentService.getBillingPortal();
      if (url) window.location.href = url;
    } catch {
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleCancelConfirm = async () => {
    try {
      setIsCancelling(true);
      await paymentService.cancelSubscription();
      setShowCancelConfirm(false);
      // Refresh the page to show updated state
      window.location.reload();
    } catch {
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 lg:p-8 h-3/4">
      {/* Past Due Warning Banner */}
      {isPastDue && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <span className="text-red-500 text-sm">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-red-700">Payment Failed</p>
            <p className="text-xs text-red-500 mt-0.5">
              Your last payment couldn&apos;t be processed. Please update your payment method to
              keep Pro access.
            </p>
            <button
              onClick={handleBillingPortal}
              className="text-xs text-red-700 underline mt-1 font-medium"
            >
              Update payment method →
            </button>
          </div>
        </div>
      )}

      {/* Cancellation pending banner */}
      {isCancelScheduled && isPro && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm font-semibold text-amber-700">Cancellation Scheduled</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Your Pro access ends on {formatDate(subscription?.currentPeriodEnd)}. You won&apos;t be
            charged again.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Plan Info</h3>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isPro
              ? isPastDue
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-[#318D62]"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {isPro ? (isPastDue ? "Pro – Past Due" : "Pro") : "Free"}
        </span>
      </div>

      {/* Usage Bars */}
      <div className="space-y-8 mb-8">
        {/* AI Generations */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">AI Generations</h4>
            <span className="text-xs text-gray-400">{generationsLeft} left</span>
          </div>
          <div className="relative h-10 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #e5e7eb 10px, #e5e7eb 20px)`,
              }}
            />
            <div
              className={`absolute left-0 top-0 h-full rounded-full flex items-center justify-center text-white font-medium text-xs z-10 transition-all duration-500 ${
                generationsPercentage >= 90 ? "bg-red-500" : "bg-[#318D62]"
              }`}
              style={{
                width: `${Math.max(generationsPercentage, 5)}%`,
                minWidth: generationsUsed > 0 ? "40px" : "0px",
              }}
            >
              {generationsUsed}/{generationsLimit}
            </div>
          </div>
        </div>

        {/* Posts */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Posts Created</h4>
            <span className="text-xs text-gray-400">{postsLeft} left</span>
          </div>
          <div className="relative h-10 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-100">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #e5e7eb 10px, #e5e7eb 20px)`,
              }}
            />
            <div
              className={`absolute left-0 top-0 h-full rounded-full flex items-center justify-center text-white font-medium text-xs z-10 transition-all duration-500 ${
                postsPercentage >= 90 ? "bg-red-500" : "bg-[#318D62]"
              }`}
              style={{
                width: `${Math.max(postsPercentage, 5)}%`,
                minWidth: postsUsed > 0 ? "40px" : "0px",
              }}
            >
              {postsUsed}/{postsLimit}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between text-xs text-gray-500 mb-6">
        <div className="flex justify-between w-full sm:w-auto sm:block mb-1 sm:mb-0">
          <span>{isPro ? "Billing Started" : "Member Since"}</span>
          <span className="ml-0 sm:ml-8 font-medium text-gray-900">
            {formatDate(subscription?.currentPeriodStart)}
          </span>
        </div>
        {isPro && (
          <div className="flex justify-between w-full sm:w-auto sm:block">
            <span>{isCancelScheduled ? "Access Until" : "Next Renewal"}</span>
            <span className="ml-0 sm:ml-8 font-medium text-gray-900">
              {formatDate(subscription?.currentPeriodEnd)}
            </span>
          </div>
        )}
      </div>

      {/* Free tier — Upgrade CTA */}
      {!isPro && (
        <div className="bg-[#318D62] rounded-xl p-6 text-center text-white">
          <p className="text-sm font-semibold mb-1">Upgrade to Pro</p>
          <p className="text-xs opacity-80 mb-4">100 posts + 100 AI generations/month for $4.99</p>
          <Button
            onClick={handleUpgrade}
            disabled={isUpgrading}
            variant="outline"
            className="w-full bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white rounded-full h-11"
          >
            {isUpgrading ? "Redirecting to checkout…" : "Upgrade to Pro — $4.99/mo"}
          </Button>
        </div>
      )}

      {/* Pro plan actions */}
      {isPro && (
        <div className="space-y-2">
          <div
            className={`rounded-xl p-4 text-center text-white ${isCancelScheduled ? "bg-gray-500" : "bg-gradient-to-r from-[#318D62] to-[#2a7a54]"}`}
          >
            <p className="text-sm font-medium">
              {isCancelScheduled ? "⏳ Cancellation pending" : "✨ You're on Pro"}
            </p>
            <p className="text-xs opacity-80 mt-0.5">
              {isCancelScheduled
                ? `Pro access until ${formatDate(subscription?.currentPeriodEnd)}`
                : "100 posts + 100 AI generations/month"}
            </p>
          </div>
          <Button
            onClick={handleBillingPortal}
            disabled={isOpeningPortal}
            variant="outline"
            className="w-full rounded-full h-9 text-sm border-gray-200 text-gray-600 hover:text-gray-900"
          >
            {isOpeningPortal ? "Opening portal…" : "Manage Billing"}
          </Button>
          {!isCancelScheduled && (
            <Button
              onClick={() => setShowCancelConfirm(true)}
              variant="ghost"
              className="w-full rounded-full h-9 text-xs text-gray-400 hover:text-red-500 hover:bg-red-50"
            >
              Cancel Subscription
            </Button>
          )}
        </div>
      )}

      {/* Cancel confirmation modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-gray-900 mb-2">Cancel subscription?</h3>
            <p className="text-sm text-gray-600 mb-1">
              You&apos;ll keep Pro access until{" "}
              <span className="font-medium text-gray-900">
                {formatDate(subscription?.currentPeriodEnd)}
              </span>
              .
            </p>
            <p className="text-xs text-gray-400 mb-6">
              After that, your account reverts to the Free plan (30 posts, 50 AI generations/month).
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowCancelConfirm(false)}
                variant="outline"
                className="flex-1 rounded-full"
                disabled={isCancelling}
              >
                Keep Pro
              </Button>
              <Button
                onClick={handleCancelConfirm}
                disabled={isCancelling}
                className="flex-1 rounded-full bg-red-500 hover:bg-red-600 text-white"
              >
                {isCancelling ? "Cancelling…" : "Yes, Cancel"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
