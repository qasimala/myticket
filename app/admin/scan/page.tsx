"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ShieldAlert } from "lucide-react";

type ScanState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "success"; booking: Record<string, unknown> }
  | { status: "already_used"; booking: Record<string, unknown> }
  | { status: "error"; message: string };

import ScanResult from "../../components/ScanResult";

export default function AdminScanPage() {
  const currentUser = useQuery(api.users.current);
  const scanToken = useAction(api.bookings.scanQrToken);

  const [inputValue, setInputValue] = useState("");
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const [isProcessing, setIsProcessing] = useState(false);
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
      const result = await scanToken({ token: value });
      if (result.status === "ok") {
        setScanState({ status: "success", booking: result.booking });
      } else if (result.status === "already_used") {
        setScanState({ status: "already_used", booking: result.booking });
      } else {
        setScanState({
          status: "error",
          message: result.reason ?? "Invalid or expired QR code",
        });
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
          Live verification with duplicate protection
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-white/10 bg-slate-900/80 p-6 shadow-lg"
      >
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
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isProcessing ? "Processing..." : "Validate Ticket"}
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
