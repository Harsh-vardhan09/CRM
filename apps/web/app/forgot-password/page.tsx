"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed.");
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory-50 px-4 py-12 sm:px-6 lg:px-8 selection:bg-brass/10">
      <div className="w-full max-w-md space-y-8 page-enter">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 rounded-full bg-brass" />
            <span className="font-serif text-xl tracking-tight text-ink-text font-normal">VYOR</span>
          </div>
          <h2 className="text-center text-3xl font-serif tracking-tight text-ink-text">
            Forgot Password
          </h2>
          <p className="mt-2 text-center text-xs font-mono uppercase tracking-wide text-muted-ivory">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="bg-white border border-ivory-border rounded-xl p-8 sm:p-10 shadow-editorial">
          {sent ? (
            <div className="text-center space-y-6">
              <div className="rounded-lg border border-moss/20 bg-moss/5 p-4 text-xs leading-relaxed text-moss font-mono uppercase tracking-wide">
                If an account with that email exists, a password reset link has been sent. Check your inbox (and console logs in development).
              </div>
              <Link
                href="/login"
                className="inline-block text-xs font-mono uppercase tracking-widest text-brass hover:underline"
              >
                ← Back to login
              </Link>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-lg border border-brick/20 bg-brick/5 p-3 text-sm text-brick flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs uppercase tracking-wide text-muted-ivory mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center rounded-lg bg-ink-text px-5 py-3 text-sm font-medium text-ivory-text transition hover:bg-ink-800 active:scale-[0.98] disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send Reset Link"}
                </button>
              </div>

              <div className="text-center text-xs text-muted-ivory mt-4">
                Remember your password?{" "}
                <Link href="/login" className="font-medium text-brass hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
