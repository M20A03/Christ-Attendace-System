"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithEsproToken } from "@/lib/api";
import {
  KeyRound,
  X,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  Loader2,
  ClipboardPaste,
  Smartphone,
  Laptop,
  Bookmark,
} from "lucide-react";

interface EsproTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EsproTokenModal: React.FC<EsproTokenModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [mode, setMode] = useState<"phone" | "laptop">("phone");

  if (!isOpen) return null;

  const bookmarkletCode = `javascript:location.href='https://christ-attendance-viewer.vercel.app/?token='+encodeURIComponent(sessionStorage.getItem('token')||'')`;

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2500);
  };

  const copyConsoleSnippet = () => {
    const code = `copy(sessionStorage.getItem('token') || '')`;
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTokenInput(text.trim());
        setError(null);
      }
    } catch {
      setError("Clipboard permission denied. Please paste manually into the box.");
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = tokenInput.trim();
    if (!cleaned) {
      setError("Please paste your ESPRO session token.");
      return;
    }

    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    if (cleaned.startsWith("{")) {
      try {
        const parsed = JSON.parse(cleaned);
        cleaned = parsed.token || parsed.access_token || cleaned;
      } catch {}
    }

    setLoading(true);
    setError(null);

    try {
      await loginWithEsproToken(cleaned);
      onClose();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid or expired ESPRO token. Please refresh cue.christuniversity.in and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-7 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f2b5c] text-white flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Connect Real Attendance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct sync with Christ University CUE (Port 84)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector: Phone vs Laptop */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("phone")}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mode === "phone"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
            <span>On Phone (Friends)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("laptop")}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              mode === "laptop"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-slate-400" />
            <span>On Laptop / PC</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Phone Guide */}
        {mode === "phone" ? (
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-xs space-y-2.5 text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <p className="font-bold text-slate-900 dark:text-slate-100">
                1-Tap "Sync" Bookmarklet (No typing needed)
              </p>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400">
              <li>
                Copy this 1-tap shortcut:
                <div className="mt-1 flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  <span className="truncate pr-2">Sync CUE Attendance</span>
                  <button
                    type="button"
                    onClick={copyBookmarklet}
                    className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex-shrink-0"
                  >
                    {copiedBookmarklet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedBookmarklet ? "Copied!" : "Copy Bookmarklet"}
                  </button>
                </div>
              </li>
              <li>
                Bookmark any page in Chrome/Safari, then edit its URL and paste the copied code.
              </li>
              <li>
                Open and log in to{" "}
                <a
                  href="https://cue.christuniversity.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-900 dark:text-slate-100 font-bold underline inline-flex items-center gap-0.5"
                >
                  cue.christuniversity.in <ExternalLink className="w-3 h-3 text-emerald-600" />
                </a>
              </li>
              <li>
                Tap the bookmark. It automatically grabs your session and opens this app with your real attendance loaded!
              </li>
            </ol>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs space-y-2 text-slate-700 dark:text-slate-300">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              How to get your token on PC / Mac:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 dark:text-slate-400">
              <li>
                Log in to{" "}
                <a
                  href="https://cue.christuniversity.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-900 dark:text-slate-100 font-medium underline inline-flex items-center gap-0.5"
                >
                  cue.christuniversity.in <ExternalLink className="w-3 h-3 text-emerald-600" />
                </a>
              </li>
              <li>
                Press <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px]">F12</kbd> ➔ Console.
              </li>
              <li>
                Run this command to copy token:
                <div className="mt-1 flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  <span className="truncate pr-2">copy(sessionStorage.getItem('token'))</span>
                  <button
                    type="button"
                    onClick={copyConsoleSnippet}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex-shrink-0"
                  >
                    {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSnippet ? "Copied" : "Copy"}
                  </button>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Token Form */}
        <form onSubmit={handleConnect} className="space-y-3.5 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Or Paste Token Manually
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span>Paste from clipboard</span>
              </button>
            </div>
            <textarea
              rows={2}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="px-5 py-2 rounded-xl bg-[#0f2b5c] hover:bg-[#1e3a8a] text-white text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? "Fetching Real Data..." : "Connect Real Data"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
