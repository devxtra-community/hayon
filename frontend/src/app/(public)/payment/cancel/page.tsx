import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        {/* Cancel Icon */}
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🙁</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          No worries — nothing was charged. You can upgrade to Pro whenever you&apos;re ready.
        </p>

        {/* What you get with Pro */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-8 text-left">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pro Plan Includes
          </p>
          <div className="space-y-1.5">
            <p className="text-sm text-gray-600">• 100 posts per month</p>
            <p className="text-sm text-gray-600">• 100 AI caption generations per month</p>
            <p className="text-sm text-gray-600">• All platforms included</p>
            <p className="text-sm font-semibold text-gray-800 mt-2">$4.99 / month</p>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href="/settings"
            className="block w-full bg-[#318D62] hover:bg-[#2a7a54] text-white font-semibold py-3.5 rounded-full transition-colors"
          >
            Try Again
          </Link>
          <Link
            href="/dashboard"
            className="block w-full border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 font-medium py-3.5 rounded-full transition-colors text-sm"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
