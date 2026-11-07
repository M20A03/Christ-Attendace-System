"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithEsproToken } from "@/lib/api";
import { KeyRound, X, Check, Copy, ExternalLink, AlertCircle, Loader2 } from "lucide-react";

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

  const copyBookmarklet = () => {
    const code = `sessionStorage.getItem('token') || localStorage.getItem('token')`;
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError("Please paste your ESPRO / CUE token.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginWithEsproToken(tokenInput.trim());
      onClose();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid token or unable to verify session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                Connect Live ESPRO Token
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct live synchronization with Christ University CUE portal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* How to get token guide */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2.5 text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            How to get your live token in 10 seconds:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-500 dark:text-slate-400">
            <li>
              Log in to{" "}
              <a
                href="https://cue.christuniversity.in"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 dark:text-emerald-400 font-medium underline inline-flex items-center gap-0.5"
              >
                cue.christuniversity.in <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[11px]">F12</kbd> (or right click ➔ Inspect) and open the <strong>Console</strong> tab.</li>
            <li>
              Run this command to copy your token:
              <div className="mt-1 flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                <span className="truncate">sessionStorage.getItem('token')</span>
                <button
                  type="button"
                  onClick={copyBookmarklet}
                  className="ml-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex-shrink-0"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSnippet ? "Copied" : "Copy"}
                </button>
              </div>
            </li>
            <li>Paste the output token into the box below.</li>
          </ol>
        </div>

        {/* Token Form */}
        <form onSubmit={handleConnect} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Paste Access Token or Bearer Token
            </label>
            <textarea
              rows={3}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !tokenInput.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? "Authenticating..." : "Connect ESPRO"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
