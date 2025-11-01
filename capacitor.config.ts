import type { CapacitorConfig } from '@capacitor/cli';
const serverUrl = process.env.CAP_SERVER_URL;
const hasServerUrl = typeof serverUrl === 'string' && serverUrl.trim().length > 0;

// Ensure URL has protocol
let normalizedUrl = '';
if (hasServerUrl) {
  normalizedUrl = serverUrl.trim();
  // Add https:// if no protocol is specified
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = `https://${normalizedUrl}`;
  }
}

const config: CapacitorConfig = {
  appId: 'com.myticket.app',
  appName: 'MyTicket',
  webDir: 'public',
  bundledWebRuntime: false,
  server: hasServerUrl
    ? {
        url: normalizedUrl,
        cleartext: normalizedUrl.startsWith('http://'),
      }
    : {
        androidScheme: 'https',
      },
};

export default config;
