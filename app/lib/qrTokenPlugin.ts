import { registerPlugin } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

export interface QrTokenPlugin {
  generateTokens(options: {
    bookingId: string;
    ticketId: string;
  }): Promise<{
    windowMs: number;
    tokens: Array<{
      qrValue: string;
      expiresAt: number;
    }>;
  }>;
}

// Register the plugin
const QrToken = registerPlugin<QrTokenPlugin>('QrToken', {
  web: () => {
    // Web implementation that falls back to server
    return {
      generateTokens: async () => {
        throw new Error('QrToken plugin is not available on web platform');
      },
    };
  },
});

export default QrToken;

/**
 * Check if the app is running on Android native platform
 */
export function isAndroidNative(): boolean {
  return Capacitor.getPlatform() === 'android' && Capacitor.isNativePlatform();
}

