'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin' && user.role !== 'super_admin') {
        router.push('/user'); // Redirect non-admins to sales rep page
      }
    }
  }, [user, loading, router]);

  if (loading || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-t-indigo-500 border-indigo-200 rounded-full animate-spin"></div>
          <p className="text-slate-400 font-medium text-lg">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl"></div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-100 to-indigo-400 bg-clip-text text-transparent">
              Admin Control Panel
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Configure system features and user organization roles
            </p>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 font-medium text-sm transition hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Log Out</span>
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Admin profile detail card */}
          <div className="md:col-span-1 backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3">
              Administrator Profile
            </h3>
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {user.name.charAt(0)}
              </div>
              <div>
                <h4 className="text-slate-200 font-bold text-lg">{user.name}</h4>
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 capitalize">
                  {user.role}
                </span>
              </div>
            </div>
            
            <div className="space-y-4 text-sm pt-4 border-t border-slate-800/60">
              <div>
                <span className="text-slate-500 block text-xs">Email Address</span>
                <span className="text-slate-300 font-medium">{user.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Organization ID</span>
                <span className="text-slate-300 font-mono text-xs">{user.orgId || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Last Login Session</span>
                <span className="text-slate-300 font-medium">
                  {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'First Login'}
                </span>
              </div>
            </div>
          </div>

          {/* Permissions and Role Capabilities */}
          <div className="md:col-span-2 backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-6">
            <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3">
              Role Permissions & System Capabilities
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(user.permissions).map(([key, val]) => (
                <div 
                  key={key} 
                  className={`flex items-center space-x-3 p-4 rounded-xl border transition ${
                    val 
                      ? 'bg-indigo-500/5 border-indigo-500/20 text-slate-200' 
                      : 'bg-slate-900/20 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center border ${
                    val 
                      ? 'border-indigo-400 text-indigo-400 bg-indigo-500/10' 
                      : 'border-slate-800 text-slate-600'
                  }`}>
                    {val ? '✓' : '✗'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-500">
                      {val ? 'Granted to Administrator' : 'Disabled for Role'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-5 mt-6 text-sm text-slate-400 space-y-2">
              <span className="font-semibold text-slate-300 block mb-1">🛡️ Admin Access Note</span>
              <p>As an administrator, you are granted wide-reaching permissions across organization settings. You can manage sales representatives, edit structural configuration, view financial dashboard pipelines, and verify automations.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
