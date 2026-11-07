"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithEsproToken } from "@/lib/api";
import { KeyRound, X, Check, Copy, ExternalLink, AlertCircle, Loader2, ClipboardPaste } from "lucide-react";

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

  if (!isOpen) return null;

  const copyConsoleSnippet = () => {
    const code = `copy(sessionStorage.getItem('token') || localStorage.getItem('token') || '')`;
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setTokenInput(text.trim());
        setError(null);
      }
    } catch {
      setError("Clipboard read permission denied. Please paste manually into the box.");
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = tokenInput.trim();
    if (!cleaned) {
      setError("Please paste your ESPRO session token.");
      return;
    }

    // Strip wrapping quotes or JSON if copied raw
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    if (cleaned.startsWith("{")) {
      try {
        const parsed = JSON.parse(cleaned);
        cleaned = parsed.token || parsed.access_token || cleaned;
      } catch {
        // keep as is
      }
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
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-7 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Connect Live ESPRO Token
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct synchronization with your active Christ University session
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

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 3-Step Guide */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs space-y-2.5 text-slate-700 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            How to get your session token:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400">
            <li>
              Open and log in to{" "}
              <a
                href="https://cue.christuniversity.in"
                target="_blank"
                rel="noreferrer"
                className="text-slate-900 dark:text-slate-100 font-semibold underline inline-flex items-center gap-0.5"
              >
                cue.christuniversity.in <ExternalLink className="w-3 h-3 text-emerald-600" />
              </a>
            </li>
            <li>
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200">F12</kbd> (or right click ➔ Inspect ➔ Console tab).
            </li>
            <li>
              Paste & run this command (copies token directly to clipboard):
              <div className="mt-1.5 flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200">
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

        {/* Token Form */}
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Paste ESPRO Access Token
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
              rows={3}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400"
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
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? "Verifying..." : "Connect ESPRO"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
