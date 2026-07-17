"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface CompanyData {
  id: number;
  name: string;
  status: "active" | "suspended";
  userCount: number;
  featureCount: number;
}

export default function CompanySettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [company, setCompany] = useState<CompanyData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({ name: "", status: "active" as "active" | "suspended" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isOwner = (user as any)?.isOwner;
  const isSuperAdmin = user?.role?.toLowerCase() === "super_admin";
  const companyId = (user as any)?.companyId;

  useEffect(() => {
    if (!loading) {
      if (!user) { router.push("/login"); return; }
      if (!isOwner && !isSuperAdmin) { router.push("/admin"); return; }
      if (!companyId) {
        setError("No company associated with your account.");
        setFetching(false);
        return;
      }
      fetchCompany();
    }
  }, [user, loading]);

  const fetchCompany = async () => {
    setFetching(true);
    try {
      const res = await fetch(`${API_URL}/admin/companies/${companyId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load company.");
      const data = await res.json();
      setCompany(data.data);
      setForm({ name: data.data.name, status: data.data.status });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.name.trim()) { setError("Company name is required."); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/admin/companies/${companyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: form.name, status: form.status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Update failed.");
      setCompany(data.data);
      setSuccess("Company settings updated successfully.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-12 h-12 border-4 border-t-indigo-500 border-indigo-200 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-start justify-center overflow-hidden bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="w-full max-w-2xl space-y-8 z-10">
        <div>
          <Link href="/admin" className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
          </Link>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-indigo-400 bg-clip-text text-transparent">
            Company Settings
          </h2>
          <p className="mt-2 text-sm text-slate-400">Manage your organization's name and operational status.</p>
        </div>

        {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{error}</div>}

        {company && (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-2 gap-4">
              <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-100">{company.userCount}</div>
                <div className="text-xs text-slate-500 mt-1">Active Members</div>
              </div>
              <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-slate-100">{company.featureCount}</div>
                <div className="text-xs text-slate-500 mt-1">Features Enabled</div>
              </div>
            </div>

            {/* Edit form */}
            <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 mb-6">Organization Details</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                {success && <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-400">{success}</div>}
                <div>
                  <label className="block text-sm font-medium text-slate-300">Company Name</label>
                  <div className="mt-1">
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Status</label>
                  <div className="mt-1">
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "suspended" })}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  {form.status === "suspended" && (
                    <p className="mt-2 text-xs text-yellow-400">Warning: suspending the company will block all users from logging in.</p>
                  )}
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-indigo-600 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
