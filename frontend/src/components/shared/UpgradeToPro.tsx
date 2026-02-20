"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { paymentService } from "@/services/payment.service";

interface UpgradeButtonProps {
  className?: string;
}

export function UpgradeToPro({ className }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const url = await paymentService.createCheckoutSession();
      if (url) window.location.href = url;
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUpgrade}
      disabled={loading}
      className={`w-full h-10 text-sm font-medium hover:opacity-90 ${className ?? ""}`}
      variant="black"
    >
      {loading ? "Redirecting…" : "Upgrade to Pro"}
    </Button>
  );
}
