import { Capacitor, registerPlugin } from '@capacitor/core';
import { loginWithEsproToken } from './api';

export interface CUEAuthPluginInterface {
  openPortalLogin(): Promise<{ token: string }>;
}

export const CUEAuth = registerPlugin<CUEAuthPluginInterface>('CUEAuth');

export function isNativeApp(): boolean {
  return typeof window !== 'undefined' && Capacitor.isNativePlatform();
}

/**
 * Triggers the native in-app login window loading https://cue.christuniversity.in.
 * As soon as the user logs in and completes Turnstile, the native webview extracts
 * the session token from sessionStorage/localStorage and resolves it automatically.
 */
export async function startNativePortalLogin(): Promise<{ success: boolean; error?: string }> {
  if (!isNativeApp()) {
    return { success: false, error: 'Not running in native app' };
  }

  try {
    const res = await CUEAuth.openPortalLogin();
    if (res && res.token) {
      await loginWithEsproToken(res.token.trim());
      return { success: true };
    }
    return { success: false, error: 'No token received from portal' };
  } catch (err: any) {
    if (typeof err === 'string' && err.includes('cancelled')) {
      return { success: false, error: 'Login cancelled' };
    }
    return { success: false, error: err?.message || 'Login failed' };
  }
}
