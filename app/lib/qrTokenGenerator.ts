import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import QrToken, { isAndroidNative } from "./qrTokenPlugin";

/**
 * Type definition for QR token data
 */
export type QrTokenData = {
  qrValue: string;
  expiresAt: number;
};

/**
 * Type definition for the generate result
 */
export type QrTokenResult = {
  windowMs: number;
  tokens: QrTokenData[];
};

/**
 * Check if the device is offline
 */
function isOffline(): boolean {
  if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
    return !navigator.onLine;
  }
  return false;
}

/**
 * Hook to generate QR tokens either locally (on Android) or from server (web/other platforms)
 */
export function useQrTokenGenerator() {
  const serverGenerateQrToken = useAction(api.bookings.generateQrToken);

  const generateTokens = async (
    bookingId: Id<"bookings">,
    ticketId: Id<"tickets">
  ): Promise<QrTokenResult> => {
    const offline = isOffline();
    
    // Check if we're on Android native
    if (isAndroidNative()) {
      try {
        // Use native Android plugin to generate tokens locally
        console.log('Generating QR tokens locally on Android');
        const result = await QrToken.generateTokens({
          bookingId,
          ticketId,
        });
        return result;
      } catch (error) {
        console.error('Failed to generate tokens locally:', error);
        // If offline, don't try server fallback - throw error instead
        if (offline) {
          throw new Error('Cannot generate QR tokens offline. Please check your connection and try again.');
        }
        // Fall back to server generation if native fails and we're online
        try {
          return await serverGenerateQrToken({ bookingId });
        } catch (serverError) {
          // If server also fails, check if we're offline
          if (isOffline()) {
            throw new Error('Cannot generate QR tokens offline. Please check your connection and try again.');
          }
          throw serverError;
        }
      }
    } else {
      // Use server generation for web and other platforms
      if (offline) {
        throw new Error('Cannot generate QR tokens offline. Please check your connection and try again.');
      }
      console.log('Generating QR tokens from server');
      try {
        return await serverGenerateQrToken({ bookingId });
      } catch (error) {
        // Check if error is due to offline state
        if (isOffline() || (error instanceof Error && error.message.includes('network'))) {
          throw new Error('Cannot generate QR tokens offline. Please check your connection and try again.');
        }
        throw error;
      }
    }
  };

  return {
    generateTokens,
    isUsingLocalGeneration: isAndroidNative(),
  };
}

