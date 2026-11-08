/**
 * Helper to detect if the user is running inside the installed application:
 * - Capacitor Android Native App
 * - PWA Standalone (Added to Home Screen on iOS or Android)
 * - Android TWA / WebAPK wrapper
 */
export function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;

  try {
    // 1. Capacitor Native Platform check
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      return true;
    }

    // 2. Android / Chrome / Modern Browser PWA Standalone
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
      return true;
    }

    // 3. iOS Safari "Add to Home Screen" standalone flag
    if ((window.navigator as any).standalone === true) {
      return true;
    }

    // 4. Android App package referrer (launched from launcher)
    if (document.referrer && document.referrer.includes("android-app://")) {
      return true;
    }

    // 5. Check if user launched with app-specific mode or previously installed flag
    if (localStorage.getItem("cu_app_installed") === "true") {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

