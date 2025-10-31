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
 * Hook to generate QR tokens either locally (on Android) or from server (web/other platforms)
 */
export function useQrTokenGenerator() {
  const serverGenerateQrToken = useAction(api.bookings.generateQrToken);

  const generateTokens = async (
    bookingId: Id<"bookings">,
    ticketId: Id<"tickets">
  ): Promise<QrTokenResult> => {
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
        console.error('Failed to generate tokens locally, falling back to server:', error);
        // Fall back to server generation if native fails
        return await serverGenerateQrToken({ bookingId });
      }
    } else {
      // Use server generation for web and other platforms
      console.log('Generating QR tokens from server');
      return await serverGenerateQrToken({ bookingId });
    }
  };

  return {
    generateTokens,
    isUsingLocalGeneration: isAndroidNative(),
  };
}

