import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.ac.christuniversity.attendance',
  appName: 'Christ Attendance',
  webDir: 'out',
  server: {
    // When live-testing or in production, we can load from Vercel for instant OTA updates:
    // url: 'https://christ-attendance-viewer.vercel.app',
    // cleartext: true
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;

