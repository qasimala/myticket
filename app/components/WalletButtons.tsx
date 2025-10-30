"use client";

import { useState } from "react";
import { Smartphone, CheckCircle2 } from "lucide-react";

interface WalletButtonsProps {
  bookingId: string;
  eventId?: string;
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  ticketName?: string;
  customerName?: string;
  qrValue?: string;
}

export default function WalletButtons({
  bookingId,
  eventId,
  eventName,
  eventDate,
  eventLocation,
  ticketName,
  customerName,
  qrValue,
}: WalletButtonsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToGoogleWallet = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/wallet/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          eventId,
          eventName,
          eventDate,
          eventLocation,
          ticketName,
          customerName,
          qrValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to add pass to Google Wallet");
      }

      if (!data?.saveUrl) {
        throw new Error("Wallet service returned an unexpected response");
      }

      window.open(data.saveUrl as string, "_blank", "noopener,noreferrer");

      setIsAdded(true);

      setTimeout(() => {
        setIsAdded(false);
      }, 5000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
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
      {error && (
        <p className="text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
