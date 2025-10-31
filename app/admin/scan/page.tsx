"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ShieldAlert } from "lucide-react";

import ScanResult, {
  type BookingSummary,
  type ScanState,
} from "../../components/ScanResult";

type ScanMode = "validate" | "entry";

const toBookingSummary = (data: Record<string, unknown>): BookingSummary => ({
  id: String(data.id ?? ""),
  customerName:
    typeof data.customerName === "string" ? data.customerName : null,
  customerEmail:
    typeof data.customerEmail === "string" ? data.customerEmail : null,
  quantity:
    typeof data.quantity === "number"
      ? data.quantity
      : Number.isFinite(Number(data.quantity))
        ? Number(data.quantity)
        : 0,
  eventName: typeof data.eventName === "string" ? data.eventName : null,
  ticketName: typeof data.ticketName === "string" ? data.ticketName : null,
  scannedAt: typeof data.scannedAt === "number" ? data.scannedAt : null,
});

export default function AdminScanPage() {
  const currentUser = useQuery(api.users.current);
  const validateTicket = useAction(api.bookings.validateTicket);
  const recordEntry = useAction(api.bookings.recordEntry);

  const [inputValue, setInputValue] = useState("");
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>("validate");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, [scanState.status, currentUser]);

  if (currentUser === undefined) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent"></div>
      </div>
    );
  }

  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "superadmin")
  ) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-red-500/20 bg-red-500/10 p-10 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-200">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-red-100 mb-2">
          Access Restricted
        </h2>
        <p className="text-red-200/80">
          Only administrators can access the ticket scanner.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Back to Admin
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = inputValue.trim();
    if (!value || isProcessing) return;

    setIsProcessing(true);
    setScanState({ status: "scanning" });

    try {
      if (scanMode === "validate") {
        const result = await validateTicket({ token: value });
        if (result.status === "ok") {
          const booking = toBookingSummary(
            result.booking as Record<string, unknown>
          );
          setScanState({
            status: "validated",
            booking,
          });
        } else if (result.status === "already_validated") {
          const booking = toBookingSummary(
            result.booking as Record<string, unknown>
          );
          setScanState({
            status: "already_validated",
            booking,
          });
        } else if (result.status === "already_entered") {
          const booking = toBookingSummary(
            result.booking as Record<string, unknown>
          );
          setScanState({
            status: "already_entered",
            booking,
          });
        } else {
          setScanState({
            status: "error",
            message: result.reason ?? "Invalid or expired QR code",
          });
        }
      } else {
        // Entry mode
        const result = await recordEntry({ token: value });
        if (result.status === "ok") {
          const booking = toBookingSummary(
            result.booking as Record<string, unknown>
          );
          setScanState({
            status: "success",
            booking,
          });
        } else if (result.status === "already_entered") {
          const booking = toBookingSummary(
            result.booking as Record<string, unknown>
          );
          setScanState({
            status: "already_entered",
            booking,
          });
        } else {
          setScanState({
            status: "error",
            message: result.reason ?? "Invalid or expired QR code",
          });
        }
      }
    } catch (error: unknown) {
      setScanState({
        status: "error",
        message: (error as Error).message || "Failed to process QR code",
      });
    }
    finally {
      setIsProcessing(false);
      setInputValue("");
      inputRef.current?.focus();
    }
  };

  const resetScanState = () => {
    setScanState({ status: "idle" });
    setInputValue("");
    inputRef.current?.focus();
  };

  return (
    <div className="mx-auto w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Ticket Scanner</h1>
        <p className="mt-2 text-slate-400">
          Focus the input below and scan a live QR code. Physical scanners
          will type the token and submit automatically.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-4 py-2 text-xs font-semibold text-indigo-300">
          <span className="h-2 w-2 rounded-full bg-indigo-400"></span>
          Two-step verification: Validation → Entry
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-white/10 bg-slate-900/80 p-6 shadow-lg"
      >
        {/* Mode Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-3">
            Scan Mode
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setScanMode("validate")}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                scanMode === "validate"
                  ? "bg-orange-600 text-white border-2 border-orange-500"
                  : "bg-slate-800 text-slate-300 border-2 border-slate-700 hover:border-slate-600"
              }`}
            >
              <span className="block">Step 1: Validate</span>
              <span className="text-xs opacity-80">Check ticket authenticity</span>
            </button>
            <button
              type="button"
              onClick={() => setScanMode("entry")}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                scanMode === "entry"
                  ? "bg-indigo-600 text-white border-2 border-indigo-500"
                  : "bg-slate-800 text-slate-300 border-2 border-slate-700 hover:border-slate-600"
              }`}
            >
              <span className="block">Step 2: Entry</span>
              <span className="text-xs opacity-80">Grant access & disable ticket</span>
            </button>
          </div>
        </div>

        <label
          htmlFor="qr-token"
          className="block text-sm font-semibold text-slate-300"
        >
          Scan or paste QR token
        </label>
        <input
          id="qr-token"
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Focus here and scan the code"
          autoComplete="off"
          disabled={isProcessing}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-base text-slate-100 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className={`inline-flex items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              scanMode === "validate" 
                ? "bg-orange-600 hover:bg-orange-700" 
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {isProcessing 
              ? "Processing..." 
              : scanMode === "validate" 
                ? "Validate Ticket" 
                : "Record Entry"}
          </button>
          <button
            type="button"
            onClick={resetScanState}
            className="text-sm font-medium text-slate-400 hover:text-slate-300"
          >
            Clear
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-100 mb-3">
          Scan Result
        </h2>
        <ScanResult scanState={scanState} resetScanState={resetScanState} />
      </div>

      <Link
        href="/admin"
        className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800"
      >
        Back to Admin Dashboard
      </Link>
    </div>
  );
}
