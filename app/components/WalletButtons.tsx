"use client";

import { useState } from "react";
import { Smartphone, CheckCircle2 } from "lucide-react";

interface WalletButtonsProps {
  bookingId: string;
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  qrValue?: string;
}

export default function WalletButtons({
  bookingId,
  eventName,
  eventDate,
  eventLocation,
  qrValue,
}: WalletButtonsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToGoogleWallet = async () => {
    setIsGenerating(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsGenerating(false);
    setIsAdded(true);

    // Reset success state after 5 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 5000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Smartphone className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
        <span className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
          Add to Wallet
        </span>
      </div>

      {isAdded ? (
        <div className="w-full rounded-xl border border-green-500/30 bg-green-500/20 px-5 py-3 flex items-center justify-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-300" strokeWidth={1.8} />
          <span className="text-sm font-semibold text-green-200">
            Added to Google Wallet!
          </span>
        </div>
      ) : (
        <button
          onClick={handleAddToGoogleWallet}
          disabled={isGenerating || !qrValue}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:border-white/20 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400/30 border-t-gray-900"></div>
              <span>Adding to wallet...</span>
            </>
          ) : (
            <span>Add to Google Wallet</span>
          )}
        </button>
      )}

      {!qrValue && (
        <p className="text-xs text-slate-500 text-center">
          Please wait for the QR code to load before adding to wallet
        </p>
      )}
    </div>
  );
}
