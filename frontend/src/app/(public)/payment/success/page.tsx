import { Suspense } from "react";
import PaymentSuccessContent from "./PaymentSuccessContent";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-6">
      <Suspense fallback={<SuccessShell />}>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}

function SuccessShell() {
  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
        <span className="text-4xl">✨</span>
      </div>
      <p className="text-gray-400 text-sm">Confirming your subscription…</p>
    </div>
  );
}
