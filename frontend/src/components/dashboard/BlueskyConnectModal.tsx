"use client";
import React, { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/axios";
import { useToast } from "@/context/ToastContext";

interface BlueskyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const BlueskyConnectModal: React.FC<BlueskyConnectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [identifier, setIdentifier] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !appPassword) {
      showToast("error", "Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      // If the identifier doesn't look like a handle (no dots), append .bsky.social
      const finalIdentifier = identifier.includes(".") ? identifier : `${identifier}.bsky.social`;

      await api.post("/platform/bluesky/connect", {
        identifier: finalIdentifier,
        appPassword,
      });
      showToast("success", "Connected", "Bluesky account connected successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error);
        showToast("error", "Connection Failed", error.message || "Failed to connect to Bluesky");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#318D62]/5 p-6 border-b border-[#318D62]/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              B
            </div>
            <h2 className="text-xl font-bold text-gray-900">Connect Bluesky</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Username or Handle</Label>
              <Input
                id="identifier"
                placeholder="e.g. alice.bsky.social"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appPassword">App Password</Label>
              <Input
                id="appPassword"
                type="password"
                placeholder="xxxx-xxxx-xxxx-xxxx"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-[11px] text-gray-500">
                Do not use your main login password. Use an App Password instead.
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-full border-gray-200"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-full bg-[#318D62] hover:bg-[#287350] text-white"
                disabled={isLoading}
              >
                {isLoading ? "Connecting..." : "Connect Account"}
              </Button>
            </div>
          </form>
        </div>

        {/* Footer/Help Link */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end items-center border-t border-gray-100">
          <a
            href="https://bsky.app/settings/app-passwords"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 transition-colors"
          >
            How to create an App Password
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default BlueskyConnectModal;
