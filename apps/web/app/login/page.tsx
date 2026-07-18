'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { VyorLogo } from '../components/VyorLogo';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      const role = user.role?.toLowerCase();
      if (role === 'admin' || role === 'super_admin') router.push('/admin');
      else router.push('/user');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const schema = z.object({
      email:    z.string().email('Enter a valid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
    });
    try {
      schema.parse({ email, password });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors.map(e => e.message).join(', '));
        return;
      }
    }
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (!result.success) setError(result.error || 'Invalid credentials.');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fill = (e: string, p: string) => { setEmail(e); setPassword(p); setError(''); };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0B10]">
        {/* Loading: a single trace redrawing itself */}
        <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
          <motion.path
            d="M4 12 L76 12"
            stroke="#34E7C4" strokeWidth="2" strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0A0B10] selection:bg-[#34E7C4]/20">
      
      {/* Left Panel — dark branding, no corner glows */}
      <div
        className="hidden lg:flex lg:w-5/12 relative overflow-hidden flex-col justify-between p-14"
        style={{ background: 'linear-gradient(to bottom right, #14151F, #0A0B10, #211A34)' }}
      >
        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }}
        />

        {/* Top: Logo + wordmark */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 relative z-10"
        >
          <VyorLogo size={44} />
          <span style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
            className="text-2xl font-light tracking-wide text-[#EDE6D6]">
            VYOR <span className="text-[#6E6678]">CRM</span>
          </span>
        </motion.div>

        {/* Center: Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="relative z-10 max-w-xs"
        >
          <h2
            style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
            className="text-4xl font-light leading-tight text-[#EDE6D6] mb-4"
          >
            Administrative Control,{' '}
            <span style={{ fontStyle: 'italic' }}>Simplified.</span>
          </h2>
          <p className="text-sm text-[#6E6678] leading-relaxed">
            The ledger that remembers itself. Consolidate tenants, manage roles, and deploy features — with memory that persists across every session.
          </p>

          {/* Faint annotated note */}
          <div className="mt-8 pl-4 border-l border-[#34E7C4]/25 relative">
            <span className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full bg-[#34E7C4] block" />
            <p style={{ fontFamily: 'var(--font-mono), monospace' }}
              className="text-xs text-[#6E6678]">
              memory · active · 3 modules indexed
            </p>
          </div>
        </motion.div>

        {/* Bottom: Footer */}
        <div className="relative z-10 text-xs text-[#6E6678]"
          style={{ fontFamily: 'var(--font-mono), monospace' }}>
          © 2026 VYOR Technologies
        </div>
      </div>

      {/* Right Panel — parchment-tinted auth */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-14 bg-[#0A0B10] relative">
        
        {/* Subtle radial depth — not a glow, just air */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 60% 50%, rgba(52,231,196,0.025) 0%, transparent 70%)' }} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-10">
            <VyorLogo size={40} />
            <span style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
              className="text-2xl font-light text-[#EDE6D6]">
              VYOR <span className="text-[#6E6678]">CRM</span>
            </span>
          </div>

          {/* Auth Card */}
          <div className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(237,230,214,0.03)',
              border: '1px solid rgba(237,230,214,0.08)',
              boxShadow: '0 20px 60px -15px rgba(10,11,16,0.8)',
            }}>
            {/* Top hairline */}
            <div className="absolute top-0 left-8 right-8 h-px bg-[#EDE6D6]/10" />

            <div className="p-8 sm:p-10">
              <div className="mb-8">
                <h1
                  style={{ fontFamily: 'var(--font-fraunces), Georgia, serif' }}
                  className="text-2xl font-light text-[#EDE6D6] tracking-tight"
                >
                  Welcome back
                </h1>
                <p className="text-sm text-[#6E6678] mt-1.5">Sign in to your VYOR account</p>
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
                      <div className="rounded-lg p-4 text-sm flex items-center gap-3"
                        style={{ background: 'rgba(255,99,85,0.08)', border: '1px solid rgba(255,99,85,0.2)', color: '#FF6355' }}>
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1.5 ml-0.5"
                    style={{ color: 'rgba(237,230,214,0.8)' }}>
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 transition-colors group-focus-within:[color:#34E7C4]"
                        style={{ color: '#6E6678' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="email" name="email" type="email" autoComplete="email" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="block w-full rounded-xl pl-10 pr-4 py-3.5 text-sm outline-none transition-all"
                      style={{
                        background: 'rgba(10,11,16,0.6)',
                        border: '1px solid rgba(237,230,214,0.08)',
                        color: '#EDE6D6',
                        fontFamily: 'var(--font-inter), sans-serif',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(52,231,196,0.4)'; e.target.style.boxShadow = '0 0 0 1px rgba(52,231,196,0.3)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(237,230,214,0.08)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1.5 ml-0.5"
                    style={{ color: 'rgba(237,230,214,0.8)' }}>
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 transition-colors group-focus-within:[color:#34E7C4]"
                        style={{ color: '#6E6678' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password" name="password" type="password" autoComplete="current-password" required
                      value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full rounded-xl pl-10 pr-4 py-3.5 text-sm outline-none transition-all"
                      style={{
                        background: 'rgba(10,11,16,0.6)',
                        border: '1px solid rgba(237,230,214,0.08)',
                        color: '#EDE6D6',
                        fontFamily: 'var(--font-inter), sans-serif',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(52,231,196,0.4)'; e.target.style.boxShadow = '0 0 0 1px rgba(52,231,196,0.3)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(237,230,214,0.08)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {/* CTA — ink-well press, no shimmer */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center rounded-xl py-3.5 text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: '#34E7C4',
                      color: '#0A0B10',
                      boxShadow: '0 4px 16px rgba(52,231,196,0.15)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#4FF0D2')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#34E7C4')}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Signing in…
                      </span>
                    ) : 'Sign In'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sandbox accounts */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1" style={{ background: 'rgba(237,230,214,0.06)' }} />
              <span style={{ fontFamily: 'var(--font-mono), monospace', color: '#6E6678' }}
                className="text-[10px] uppercase tracking-widest">
                Test Accounts
              </span>
              <div className="h-px flex-1" style={{ background: 'rgba(237,230,214,0.06)' }} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Super Admin', email: 'superadmin@crm.com', pass: 'super123' },
                { label: 'Admin',       email: 'admin@crm.com',      pass: 'admin123' },
                { label: 'Sales Rep',   email: 'sales@crm.com',      pass: 'sales123' },
              ].map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fill(acc.email, acc.pass)}
                  className="group flex flex-col items-center justify-center p-3 rounded-xl text-xs transition-all"
                  style={{
                    background: '#14151F',
                    border: '1px solid rgba(237,230,214,0.06)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(52,231,196,0.3)';
                    e.currentTarget.style.background = 'rgba(52,231,196,0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(237,230,214,0.06)';
                    e.currentTarget.style.background = '#14151F';
                  }}
                >
                  <span className="font-medium text-[#A8A0B0] mb-0.5 group-hover:text-[#34E7C4] transition-colors">
                    {acc.label}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono), monospace', color: '#6E6678', fontSize: '9px' }}>
                    {acc.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
