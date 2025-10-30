'use client';

export type BookingSummary = {
  id: string;
  customerName?: string | null;
  customerEmail?: string | null;
  quantity: number;
  eventName?: string | null;
  ticketName?: string | null;
  scannedAt?: number | null;
};

export type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'success'; booking: BookingSummary }
  | { status: 'already_used'; booking: BookingSummary }
  | { status: 'error'; message: string };

export default function ScanResult({
  scanState,
  resetScanState,
}: {
  scanState: ScanState;
  resetScanState: () => void;
}) {
  if (scanState.status === 'idle') {
    return (
      <p className="text-sm text-slate-400">
        Scan a ticket to see the result here.
      </p>
    );
  }

  if (scanState.status === 'scanning') {
    return (
      <div className="flex items-center gap-3 text-indigo-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400"></div>
        <span className="text-sm font-medium">Validating ticket...</span>
      </div>
    );
  }

  if (scanState.status === 'error') {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/20 p-4 text-red-200">
        <p className="font-semibold">Scan Failed</p>
        <p className="text-sm">{scanState.message}</p>
      </div>
    );
  }

  if (scanState.status === 'success' || scanState.status === 'already_used') {
    const { id, customerName, customerEmail, eventName, ticketName, quantity } =
      scanState.booking;
    const scannedAt =
      typeof scanState.booking.scannedAt === 'number'
        ? scanState.booking.scannedAt
        : null;
    const badgeStyle =
      scanState.status === 'success'
        ? 'bg-green-500/20 text-green-200 border-green-500/30'
        : 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30';

    return (
      <div className="space-y-4 rounded-lg border border-white/10 bg-slate-800/50 p-4 shadow-sm">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badgeStyle}`}
        >
          {scanState.status === 'success'
            ? 'Ticket Valid'
            : 'Ticket Already Used'}
        </span>
        <div className="space-y-2 text-sm text-slate-300">
          <p>
            <span className="font-semibold text-slate-100">Booking ID:</span>{' '}
            {id}
          </p>
          <p>
            <span className="font-semibold text-slate-100">Customer:</span>{' '}
            {customerName ?? 'Unknown'}
          </p>
          <p>
            <span className="font-semibold text-slate-100">Email:</span>{' '}
            {customerEmail ?? '--'}
          </p>
          <p>
            <span className="font-semibold text-slate-100">Event:</span>{' '}
            {eventName ?? '--'}
          </p>
          <p>
            <span className="font-semibold text-slate-100">Ticket:</span>{' '}
            {ticketName ?? '--'}
          </p>
          <p>
            <span className="font-semibold text-slate-100">Quantity:</span>{' '}
            {quantity}
          </p>
          {scannedAt !== null && (
            <p className="text-xs text-slate-400">
              Marked scanned at: {new Date(scannedAt).toLocaleString()}
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
  }

  return null;
}
