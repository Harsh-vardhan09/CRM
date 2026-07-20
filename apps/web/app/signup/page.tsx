"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignupPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'company' | 'employee'>('company');

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Zod validation schemas
    const baseSchema = z.object({
      name: z.string().min(2, 'Name must be at least 2 characters'),
      email: z.string().email('Please enter a valid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password is too long'),
    });

    try {
      if (activeTab === 'company') {
        const companySchema = baseSchema.extend({
          companyName: z.string().min(2, 'Company Name must be at least 2 characters'),
        });
        companySchema.parse({ name, email, password, companyName });
      } else {
        const employeeSchema = baseSchema.extend({
          companyId: z.number().int().positive('Company ID must be a positive integer'),
        });
        employeeSchema.parse({ name, email, password, companyId: Number(companyId) });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorMessages = err.errors.map((e) => e.message).join(', ');
        setError(errorMessages);
        return;
      }
    }

    setIsLoading(true);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      let endpoint = "";
      let payload = {};

      if (activeTab === "company") {
        endpoint = `${API_URL}/auth/signup/company`;
        payload = { companyName, name, email, password };
      } else {
        endpoint = `${API_URL}/auth/signup/employee`;
        payload = { companyId: Number(companyId), name, email, password };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "An error occurred during registration.");
      } else {
        if (activeTab === "company") {
          // Redirect the CEO to the admin panel
          router.push("/admin");
        } else {
          setSuccess(
            data.message ||
            "Your request was submitted and is awaiting approval.",
          );
          // Clear form on success
          setCompanyName("");
          setCompanyId("");
          setName("");
          setEmail("");
          setPassword("");
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-ivory-50 text-ink-text selection:bg-brass/10">
      
      {/* Left Panel — Dark spine */}
      <div className="hidden lg:flex lg:w-5/12 bg-ink-950 border-r border-ink-border flex-col justify-between p-14 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-brass" />
          <span className="font-serif text-lg tracking-tight text-ivory-text font-normal">VYOR</span>
        </div>

        <div className="max-w-xs space-y-6">
          <h2 className="font-serif text-4xl leading-tight text-ivory-text tracking-tight">
            Create an Workspace <span className="italic font-normal">Today.</span>
          </h2>
          <p className="text-sm text-muted-ink leading-relaxed font-sans font-light">
            Empower your sales rep workspace with automated message templates, smart lead pipelines, and organization-scoped client intelligence.
          </p>

          <div className="pl-4 border-l border-brass/35 relative">
            <span className="absolute -left-[3.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-brass" />
            <p className="font-mono text-xs text-muted-ink">
              join or create company
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-muted-ink">
          © 2026 VYOR Technologies
        </div>
      </div>

      {/* Right Panel — Ivory canvas */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-14 relative">
        <div className="w-full max-w-md relative z-10 page-enter">
          
          <div className="lg:hidden flex items-center gap-2 justify-center mb-10">
            <div className="w-5 h-5 rounded-full bg-brass" />
            <span className="font-serif text-xl tracking-tight text-ink-text font-normal">VYOR</span>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-ivory-border rounded-xl p-8 sm:p-10 shadow-editorial">
            <div className="mb-6">
              <h1 className="text-2xl font-serif text-ink-text tracking-tight">
                Create an Account
              </h1>
              <p className="text-sm text-muted-ivory mt-1.5">Register a new workspace or join your team</p>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-ivory-100 rounded-lg mb-6 border border-ivory-border">
              <button
                type="button"
                onClick={() => { setActiveTab('company'); setError(''); setSuccess(''); }}
                className={`w-full py-2 text-xs font-mono uppercase tracking-wide rounded-md transition-colors ${
                  activeTab === 'company'
                    ? 'bg-brass text-white shadow'
                    : 'text-muted-ivory hover:text-ink-text'
                }`}
              >
                New Company
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('employee'); setError(''); setSuccess(''); }}
                className={`w-full py-2 text-xs font-mono uppercase tracking-wide rounded-md transition-colors ${
                  activeTab === 'employee'
                    ? 'bg-brass text-white shadow'
                    : 'text-muted-ivory hover:text-ink-text'
                }`}
              >
                Join Company
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <div className="rounded-lg p-4 text-sm flex items-center gap-3 border border-brick/20 bg-brick/5 text-brick font-sans">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                      {error}
                    </div>
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    <div className="rounded-lg p-4 text-sm flex items-center gap-3 border border-moss/20 bg-moss/5 text-moss font-sans">
                      <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
                      {success}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {activeTab === "company" ? (
                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ivory mb-1.5">Company Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                    placeholder="Acme Corp"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ivory mb-1.5">Company ID</label>
                  <input
                    type="number"
                    required
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                    placeholder="1"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs uppercase tracking-wide text-muted-ivory mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-muted-ivory mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wide text-muted-ivory mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center rounded-lg bg-ink-text px-5 py-3 text-sm font-medium text-ivory-text transition-colors hover:bg-ink-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing up…
                    </span>
                  ) : 'Sign Up'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center text-xs text-muted-ivory">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-brass hover:underline">
                Sign in here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
