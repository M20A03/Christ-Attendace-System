"use client";

import React, { useState, useEffect } from "react";
import { Share, PlusSquare, X, Download, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

export const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already in standalone mode (PWA installed on home screen)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes("android-app://");

    if (isStandalone) {
      return;
    }

    // Check if user has dismissed previously in this session
    const dismissed = sessionStorage.getItem("pwa_prompt_dismissed");
    if (dismissed) {
      return;
    }

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Delay prompt slightly for natural UX
      const timer = setTimeout(() => setShowPrompt(true), 2500);
      return () => clearTimeout(timer);
    }

    // Android / Chrome beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Fallback timer for Android if browser didn't fire event immediately
    const fallbackTimer = setTimeout(() => {
      setShowPrompt(true);
    }, 3500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-50 select-none"
    >
      <div className="bg-slate-950/95 dark:bg-slate-900/95 text-white p-4 rounded-3xl border border-slate-800 shadow-[0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl flex items-start gap-3">
        {/* Technical App Mark */}
        <div className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700/80 flex flex-col items-center justify-center flex-shrink-0 shadow-sm px-1">
          <span className="font-mono text-[9px] font-black tracking-wider text-white leading-none">
            CHRIST
          </span>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[7px] font-mono font-bold text-slate-400 tracking-widest">
              SYS
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-sm tracking-tight text-white">
              Install App on your Phone
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Auto-Sync
            </span>
          </div>

          {isIOS ? (
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              To install on iPhone: tap the{" "}
              <Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-400" /> <strong>Share</strong>{" "}
              button in Safari, then tap{" "}
              <span className="font-bold text-white underline decoration-slate-600">
                "Add to Home Screen"
              </span>{" "}
              <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-slate-300" />.
            </p>
          ) : deferredPrompt ? (
            <div className="mt-1 space-y-2">
              <p className="text-xs text-slate-300">
                Install as a full-screen app with automatic silent updates.
              </p>
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>1-Tap Install on Android</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Tap the browser menu (<strong>⋮</strong>) and choose{" "}
              <span className="font-bold text-white">"Install app"</span> or{" "}
              <span className="font-bold text-white">"Add to Home screen"</span>.
            </p>
          )}
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-xl transition-colors hover:bg-slate-800"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
