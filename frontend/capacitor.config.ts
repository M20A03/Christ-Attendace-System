import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.ac.christuniversity.attendance',
  appName: 'Christ Attendance',
  webDir: 'out',
  server: {
    url: 'https://christ-attendance-viewer.vercel.app',
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;

