import { useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import QrToken, { isAndroidNative } from "./qrTokenPlugin";
import { getCachedData, setCachedData } from "./offlineCache";
import { generateQrTokensClient } from "./qrTokenClient";

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

const QR_SECRET_CACHE_KEY = "qr_secret";
// Cache secret for 30 days (same user should have access)
const QR_SECRET_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

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
 * Get cached QR secret or fetch from server
 */
async function getQrSecret(serverGetQrSecret: () => Promise<string>): Promise<string | null> {
  // Try to get from cache first
  const cachedSecret = await getCachedData<string>(QR_SECRET_CACHE_KEY, QR_SECRET_CACHE_TTL);
  if (cachedSecret) {
    return cachedSecret;
  }

  // If offline, we can't fetch the secret
  if (isOffline()) {
    return null;
  }

  // Fetch from server and cache it
  try {
    const secret = await serverGetQrSecret();
    await setCachedData(QR_SECRET_CACHE_KEY, secret, QR_SECRET_CACHE_TTL);
    return secret;
  } catch (error) {
    console.error('Failed to fetch QR secret:', error);
    return null;
  }
}

/**
 * Hook to generate QR tokens either locally (on Android/web) or from server
 * Supports offline generation when secret is cached
 */
export function useQrTokenGenerator() {
  const serverGenerateQrToken = useAction(api.bookings.generateQrToken);
  const serverGetQrSecret = useAction(api.bookings.getQrSecret);

  const generateTokens = useCallback(async (
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
      // Web/other platforms: Try client-side generation first if we have cached secret
      const cachedSecret = await getQrSecret(serverGetQrSecret);
      
      if (cachedSecret) {
        try {
          console.log('Generating QR tokens client-side using cached secret');
          const result = await generateQrTokensClient(cachedSecret, bookingId, ticketId);
          // Verify we got valid tokens before returning
          if (result && result.tokens && result.tokens.length > 0) {
            return result;
          }
          // If no valid tokens, fall through to server generation if online
          console.warn('Client-side generation returned no valid tokens, falling back to server');
        } catch (error) {
          console.error('Failed to generate tokens client-side:', error);
          // If offline, throw error (can't fetch from server)
          if (offline) {
            throw new Error('Failed to generate QR tokens offline. Please check your connection and try again.');
          }
          // If online, fall through to server generation
          console.log('Falling back to server generation');
        }
      }
      
      // Fall back to server generation (online only)
      if (offline) {
        throw new Error('Cannot generate QR tokens offline. Secret not cached. Please connect to the internet first to cache the secret.');
      }
      
      console.log('Generating QR tokens from server');
      try {
        const result = await serverGenerateQrToken({ bookingId });
        // Also cache the secret for future offline use (in background, don't wait)
        getQrSecret(serverGetQrSecret).catch((err) => {
          console.warn('Failed to cache QR secret:', err);
        });
        return result;
      } catch (error) {
        // Check if error is due to offline state
        if (isOffline() || (error instanceof Error && error.message.includes('network'))) {
          throw new Error('Cannot generate QR tokens offline. Please check your connection and try again.');
        }
        throw error;
      }
    }
  }, [serverGenerateQrToken, serverGetQrSecret]);

  return {
    generateTokens,
    isUsingLocalGeneration: isAndroidNative(),
  };
}

