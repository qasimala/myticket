/**
 * Client-side QR Token Generator using Web Crypto API
 * Allows offline QR code generation when secret is cached
 */

const QR_WINDOW_MS = 15_000;

export type QrTokenData = {
  qrValue: string;
  expiresAt: number;
};

export type QrTokenResult = {
  windowMs: number;
  tokens: QrTokenData[];
};

const encoder = new TextEncoder();

/**
 * Convert ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Import HMAC key from secret string
 */
async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

/**
 * Compute HMAC-SHA256 signature
 */
async function computeSignature(
  key: CryptoKey,
  bookingId: string,
  ticketId: string,
  slot: number
): Promise<string> {
  const payloadBase = `${bookingId}:${ticketId}:${slot}`;
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadBase)
  );
  return bufferToHex(signature);
}

/**
 * Generate QR token for a specific time slot
 */
async function signSlot(
  key: CryptoKey,
  bookingId: string,
  ticketId: string,
  slot: number
): Promise<QrTokenData> {
  const signature = await computeSignature(key, bookingId, ticketId, slot);

  return {
    qrValue: JSON.stringify({
      bookingId,
      ticketId,
      ts: slot,
      sig: signature,
    }),
    expiresAt: (slot + 1) * QR_WINDOW_MS,
  };
}

/**
 * Generate QR tokens client-side using cached secret
 */
export async function generateQrTokensClient(
  secret: string,
  bookingId: string,
  ticketId: string
): Promise<QrTokenResult> {
  const key = await importHmacKey(secret);
  const timeSlot = Math.floor(Date.now() / QR_WINDOW_MS);

  const tokens = await Promise.all([
    signSlot(key, bookingId, ticketId, timeSlot),
    signSlot(key, bookingId, ticketId, timeSlot + 1),
  ]);

  return {
    windowMs: QR_WINDOW_MS,
    tokens,
  };
}

