"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeAuthCode } from "@/lib/api";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Securing credentials with Christ University...");

  useEffect(() => {
    async function processCodeExchange() {
      const code = searchParams.get("code");
      const err = searchParams.get("error");
      const errDesc = searchParams.get("error_description");

      if (err) {
        setError(errDesc || "Keycloak login was cancelled or failed.");
        return;
      }

      if (!code) {
        setError("Missing authorization code from Keycloak redirect.");
        return;
      }

      try {
        let codeVerifier = sessionStorage.getItem("pkce_code_verifier") || "";

        // If in demo mode or code verifier missing, use standard fallback verifier
        if (!codeVerifier) {
          codeVerifier = "mock-demo-verifier-christ-university";
        }

        setStatusMessage("Exchanging PKCE authorization code...");
        const redirectUri = `${window.location.origin}/callback`;

        await exchangeAuthCode(code, codeVerifier, redirectUri);

        // Clean up verifier from sessionStorage
        sessionStorage.removeItem("pkce_code_verifier");

        setStatusMessage("Authenticated successfully! Loading your dashboard...");
        router.push("/dashboard");
      } catch (err: any) {
        console.error("Token exchange failed:", err);
        setError(err.message || "Failed to exchange authorization code for tokens.");
      }
    }

    processCodeExchange();
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] flex items-center justify-center p-6 text-slate-900 dark:text-white">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-rose-500/20 shadow-xl text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Authentication Error</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{error}</p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] flex items-center justify-center p-6 text-slate-900 dark:text-white">
      <div className="max-w-sm w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
        <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
        </div>
        <h2 className="text-lg font-bold">Authenticating</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{statusMessage}</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#080c14] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}

