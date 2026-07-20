"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const role = user.role?.toLowerCase();
      if (role === "admin" || role === "super_admin") router.push("/admin");
      else router.push("/user");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const schema = z.object({
      email: z.string().email("Enter a valid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    });
    try {
      schema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors.map((e) => e.message).join(", "));
        return;
      }
    }
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (!result.success) setError(result.error || "Invalid credentials.");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ivory-50 text-ink-text">
        <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
          <path
            d="M4 12 L76 12"
            stroke="#9C7A3C"
            strokeWidth="2"
            strokeLinecap="round"
            className="animate-pulse"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ivory-50 text-ink-text selection:bg-brass/10">
      {/* Left Panel — Dark spine */}
      <div className="hidden lg:flex lg:w-5/12 bg-ink-950 border-r border-ink-border flex-col justify-between p-14 relative z-10">
        {/* Top: Wordmark */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-brass" />
          <span className="font-serif text-lg tracking-tight text-ivory-text font-normal">
            VYOR
          </span>
        </div>

        {/* Center: Copy */}
        <div className="max-w-xs space-y-6">
          <h2 className="font-serif text-4xl leading-tight text-ivory-text tracking-tight">
            Administrative Control,{" "}
            <span className="italic font-normal">Simplified.</span>
          </h2>
          <p className="text-sm text-muted-ink leading-relaxed font-sans font-light">
            The ledger that remembers itself. Consolidate tenants, manage roles,
            and deploy features — with memory that persists across every
            session.
          </p>

          <div className="pl-4 border-l border-brass/35 relative">
            <span className="absolute -left-[3.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-brass" />
            <p className="font-mono text-xs text-muted-ink">
              memory · active · 3 modules indexed
            </p>
          </div>
        </div>

        {/* Bottom: Footer */}
        <div className="text-xs font-mono text-muted-ink">
          © 2026 VYOR Technologies
        </div>
      </div>

      {/* Right Panel — Ivory canvas */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-14 relative">
        <div className="w-full max-w-md relative z-10 page-enter">
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex items-center gap-2 justify-center mb-10">
            <div className="w-5 h-5 rounded-full bg-brass" />
            <span className="font-serif text-xl tracking-tight text-ink-text font-normal">
              VYOR
            </span>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-ivory-border rounded-xl p-8 sm:p-10 shadow-editorial">
            <div className="mb-8">
              <h1 className="text-2xl font-serif text-ink-text tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-ivory mt-1.5">
                Sign in to your VYOR account
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="rounded-lg p-4 text-sm flex items-center gap-3 border border-brick/20 bg-brick/5 text-brick font-sans">
                      <svg
                        className="w-4 h-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div>
                <label className="block text-xs uppercase tracking-wide text-muted-ivory mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs uppercase tracking-wide text-muted-ivory mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                  required
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center rounded-lg bg-ink-text px-5 py-3 text-sm font-medium text-ivory-text transition-colors hover:bg-ink-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in…
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
