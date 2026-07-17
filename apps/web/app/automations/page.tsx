"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Automation {
  id: number;
  name: string;
  trigger: string;
  action: string;
  actionConfig: { channel: string; template: string };
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const CHANNELS = ["EMAIL", "SMS", "WHATSAPP"] as const;
const CHANNEL_ICON: Record<string, string> = { EMAIL: "✉", SMS: "💬", WHATSAPP: "📱" };

export default function AutomationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [automations, setAutomations] = useState<Automation[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", channel: "EMAIL" as typeof CHANNELS[number], template: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [toggling, setToggling] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Determine write access: admin/super_admin has automations:write; sales rep has only read
  const canWrite = user?.role?.toLowerCase() === "admin" ||
    user?.role?.toLowerCase() === "super_admin" ||
    (user as any)?.isSuperAdmin;

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchAutomations = useCallback(async () => {
    setFetching(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/automations`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load automations.");
      const data = await res.json();
      setAutomations(data.data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) fetchAutomations();
  }, [fetchAutomations, authLoading, user]);

  const handleToggle = async (automation: Automation) => {
    setToggling(automation.id);
    try {
      const res = await fetch(`${API_URL}/automations/${automation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled: !automation.enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Toggle failed.");
      setAutomations((prev) => prev.map((a) => (a.id === automation.id ? data.data : a)));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete automation "${name}"?`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`${API_URL}/automations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed.");
      }
      setAutomations((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setCreateError("Name is required."); return; }
    if (!form.template.trim()) { setCreateError("Message template is required."); return; }
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch(`${API_URL}/automations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          trigger: "LEAD_INACTIVE",
          action: "SEND_MESSAGE",
          actionConfig: { channel: form.channel, template: form.template },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Create failed.");
      setAutomations((prev) => [data.data, ...prev]);
      setShowCreate(false);
      setForm({ name: "", channel: "EMAIL", template: "" });
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const backLink = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "super_admin"
    ? "/admin"
    : "/user";

  if (authLoading) return null;

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-200 py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link href={backLink} className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors mb-2">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Workspace
            </Link>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-100 to-violet-400 bg-clip-text text-transparent">
              Automations
            </h1>
            <p className="text-slate-400 text-sm mt-1">Automated actions triggered by lead lifecycle events.</p>
          </div>
          {canWrite && (
            <button
              onClick={() => { setShowCreate(true); setCreateError(""); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold text-sm shadow-md hover:from-violet-600 hover:to-indigo-600 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Automation
            </button>
          )}
        </div>

        {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{error}</div>}

        {/* Info banner */}
        <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 text-sm text-slate-400 flex gap-3">
          <span className="text-violet-400 mt-0.5">⚡</span>
          <div>
            <span className="font-semibold text-slate-300">How automations work: </span>
            When a lead has had no interaction for {" "}
            <span className="text-violet-300 font-mono">LEAD_INACTIVITY_DAYS</span>
            {" "}(default 14) days, the decay job marks it inactive and fires any enabled
            {" "}<em>Lead goes inactive</em> automations — sending your configured message via the chosen channel.
          </div>
        </div>

        {/* Table */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
          {fetching ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-t-violet-500 border-violet-200 rounded-full animate-spin" />
            </div>
          ) : automations.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <div className="text-4xl mb-3">⚡</div>
              <p>No automations yet.</p>
              {canWrite && (
                <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                  Create your first automation →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-4 font-semibold">Name</th>
                    <th className="text-left px-4 py-4 font-semibold">Trigger</th>
                    <th className="text-left px-4 py-4 font-semibold">Channel</th>
                    <th className="text-left px-4 py-4 font-semibold">Template preview</th>
                    <th className="text-center px-4 py-4 font-semibold">Status</th>
                    {canWrite && <th className="text-right px-6 py-4 font-semibold">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {automations.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-100">{a.name}</td>
                      <td className="px-4 py-4 text-slate-400 text-xs">Lead goes inactive</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                          {CHANNEL_ICON[a.actionConfig.channel] ?? "•"} {a.actionConfig.channel}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 text-xs max-w-xs truncate">
                        {a.actionConfig.template}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {canWrite ? (
                          <button
                            onClick={() => handleToggle(a)}
                            disabled={toggling === a.id}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${a.enabled ? "bg-violet-500" : "bg-slate-700"}`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${a.enabled ? "translate-x-4" : "translate-x-1"}`} />
                          </button>
                        ) : (
                          <span className={`text-xs font-medium ${a.enabled ? "text-emerald-400" : "text-slate-600"}`}>
                            {a.enabled ? "Enabled" : "Disabled"}
                          </span>
                        )}
                      </td>
                      {canWrite && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(a.id, a.name)}
                            disabled={deleting === a.id}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                          >
                            {deleting === a.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-lg shadow-2xl space-y-5">
            <h2 className="text-xl font-bold text-slate-100">New Automation</h2>
            {createError && <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{createError}</div>}
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Automation Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm"
                  placeholder="Re-engage inactive leads"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Trigger</label>
                <div className="block w-full rounded-xl border border-slate-800/50 bg-slate-800/30 px-4 py-3 text-slate-500 text-sm cursor-not-allowed">
                  Lead goes inactive (no interaction for {"{"}LEAD_INACTIVITY_DAYS{"}"} days)
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Action</label>
                <div className="block w-full rounded-xl border border-slate-800/50 bg-slate-800/30 px-4 py-3 text-slate-500 text-sm cursor-not-allowed">
                  Send message to lead
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Channel <span className="text-red-400">*</span></label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value as typeof CHANNELS[number] })}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm"
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>{CHANNEL_ICON[ch]} {ch}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Message Template <span className="text-red-400">*</span></label>
                <textarea
                  value={form.template}
                  onChange={(e) => setForm({ ...form, template: e.target.value })}
                  required
                  rows={4}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm resize-none"
                  placeholder="Hi, we noticed we haven't connected in a while. Would you like to catch up?"
                />
                <p className="text-xs text-slate-600 mt-1">This exact text will be sent to the lead when the trigger fires.</p>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} disabled={creating} className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 transition-all shadow-md disabled:opacity-50">
                  {creating ? "Creating..." : "Create Automation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
