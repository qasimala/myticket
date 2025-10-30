import type { CapacitorConfig } from '@capacitor/cli';
const serverUrl = process.env.CAP_SERVER_URL;
const hasServerUrl = typeof serverUrl === 'string' && serverUrl.trim().length > 0;

const config: CapacitorConfig = {
  appId: 'com.myticket.app',
  appName: 'MyTicket',
  webDir: 'public',
  bundledWebRuntime: false,
  server: hasServerUrl
    ? {
        url: serverUrl,
        cleartext: serverUrl.startsWith('http://'),
      }
    : {
        androidScheme: 'https',
      },
};

export default config;
