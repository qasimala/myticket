"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAction, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

type ScanState =
  | { status: "idle" }
  | { status: "scanning" }
  | { status: "success"; booking: Record<string, unknown> }
  | { status: "already_used"; booking: Record<string, unknown> }
  | { status: "error"; message: string };

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
      <div className="p-6 lg:p-8">
        <div className="flex h-48 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "superadmin")
  ) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-10 text-center shadow-lg">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h2>
          <p className="text-gray-600">
            Only administrators can access the ticket scanner.
          </p>
          <Link
            href="/admin"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Back to Admin
          </Link>
        </div>
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
    } catch (error: any) {
      setScanState({
        status: "error",
        message: error?.message || "Failed to process QR code",
      });
    } finally {
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

  const renderResult = () => {
    if (scanState.status === "idle") {
      return (
        <p className="text-sm text-gray-500">
          Scan a ticket to see the result here.
        </p>
      );
    }

    if (scanState.status === "scanning") {
      return (
        <div className="flex items-center gap-3 text-indigo-600">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"></div>
          <span className="text-sm font-medium">Validating ticket…</span>
        </div>
      );
    }

    if (scanState.status === "error") {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-semibold">Scan Failed</p>
          <p className="text-sm">{scanState.message}</p>
        </div>
      );
    }

    const booking = scanState.booking;
    const badgeStyle =
      scanState.status === "success"
        ? "bg-green-100 text-green-800 border-green-200"
        : "bg-yellow-100 text-yellow-800 border-yellow-200";

    return (
      <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyle}`}
        >
          {scanState.status === "success" ? "Ticket Valid" : "Ticket Already Used"}
        </span>
        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <span className="font-semibold text-gray-900">Booking ID:</span>{" "}
            {booking.id as string}
          </p>
          <p>
            <span className="font-semibold text-gray-900">Customer:</span>{" "}
            {(booking.customerName as string) ?? "Unknown"}
          </p>
          <p>
            <span className="font-semibold text-gray-900">Email:</span>{" "}
            {(booking.customerEmail as string) ?? "—"}
          </p>
          <p>
            <span className="font-semibold text-gray-900">Event:</span>{" "}
            {(booking.eventName as string) ?? "—"}
          </p>
          <p>
            <span className="font-semibold text-gray-900">Ticket:</span>{" "}
            {(booking.ticketName as string) ?? "—"}
          </p>
          <p>
            <span className="font-semibold text-gray-900">Quantity:</span>{" "}
            {booking.quantity as number}
          </p>
          {booking.scannedAt && (
            <p className="text-xs text-gray-500">
              Marked scanned at:{" "}
              {new Date(booking.scannedAt as number).toLocaleString()}
            </p>
          )}
        </div>
        <button
          onClick={resetScanState}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Ready for Next Scan
        </button>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ticket Scanner</h1>
          <p className="mt-2 text-gray-600">
            Focus the input below and scan a live QR code. Physical scanners
            will type the token and submit automatically.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
            Live verification with duplicate protection
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <label
            htmlFor="qr-token"
            className="block text-sm font-semibold text-gray-700"
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
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-base shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-50"
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
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Scan Result
          </h2>
          {renderResult()}
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
        >
          Back to Admin Dashboard
        </Link>
      </div>
    </div>
  );
}
