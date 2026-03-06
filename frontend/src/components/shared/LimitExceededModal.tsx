"use client";

import { AlertCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface LimitExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LimitExceededModal({ isOpen, onClose }: LimitExceededModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    router.push("/pricing");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white rounded-3xl p-8 border-none shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center space-y-6 py-4">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 animate-bounce">
            <AlertCircle size={40} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Oops! Plan Limit Reached</h2>
            <p className="text-gray-500 text-base leading-relaxed">
              You've reached your generation limit for your current plan. Buy some extra credits to
              keep generating amazing content!
            </p>
          </div>

          <div className="w-full flex flex-col gap-3">
            <Button
              onClick={handleUpgrade}
              className="w-full h-14 rounded-2xl bg-[#318D62] hover:bg-[#287350] text-white text-lg font-bold shadow-lg shadow-green-900/20 gap-2"
            >
              <CreditCard size={20} />
              Get More Credits
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full h-12 rounded-2xl text-gray-500 font-medium hover:bg-gray-50"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
