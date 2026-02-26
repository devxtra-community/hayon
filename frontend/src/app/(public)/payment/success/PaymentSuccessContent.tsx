"use client";

import { useEffect } from "react";
// import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function PaymentSuccessContent() {
  // const searchParams = useSearchParams();
  // const sessionId = searchParams.get("session_id");
  // const [dots, setDots] = useState(".");

  // Animated dots for the loading state
  useEffect(() => {
    const interval = setInterval(() => {
      // setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
      {/* Success Icon */}
      <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re now on Pro! 🎉</h1>
      <p className="text-gray-500 text-sm mb-8 leading-relaxed">
        Your payment was successful. Your Pro plan is now active — enjoy 100 posts and 100 AI
        generations every month.
      </p>

      {/* Pro features highlight */}
      <div className="bg-green-50 rounded-2xl p-5 mb-8 text-left space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 bg-[#318D62] rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
          <span className="text-sm text-gray-700 font-medium">100 posts per month</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 bg-[#318D62] rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
          <span className="text-sm text-gray-700 font-medium">
            100 AI caption generations per month
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 bg-[#318D62] rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </span>
          <span className="text-sm text-gray-700 font-medium">
            Renews automatically every month
          </span>
        </div>
      </div>

      <Link
        href="/dashboard"
        className="block w-full bg-[#318D62] hover:bg-[#2a7a54] text-white font-semibold py-3.5 rounded-full transition-colors"
      >
        Go to Dashboard →
      </Link>

      <p className="text-xs text-gray-400 mt-4">
        You can manage your subscription anytime from{" "}
        <Link href="/settings" className="underline text-gray-500 hover:text-gray-700">
          Settings
        </Link>
        .
      </p>
    </div>
  );
}
