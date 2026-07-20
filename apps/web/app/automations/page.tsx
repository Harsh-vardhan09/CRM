"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { Plus, X, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  if (authLoading || !user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-ivory-border gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
              <span className="w-1.5 h-1.5 rounded-full bg-brass animate-pulse" />
              Automations & Triggers
            </div>
            <h1 className="text-3xl font-serif tracking-tight text-ink-text">
              Lifecycle Automations
            </h1>
            <p className="text-sm text-muted-ivory">Automated actions triggered by lead lifecycle events.</p>
          </div>
          
          {canWrite && (
            <button
              onClick={() => { setShowCreate(true); setCreateError(""); }}
              className="inline-flex items-center gap-2 rounded-lg bg-brass px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brass-hover active:scale-[0.98] self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              New Automation
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-brick/20 bg-brick/5 p-4 text-sm text-brick flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Info banner */}
        <div className="bg-white border border-ivory-border rounded-xl p-5 shadow-editorial flex gap-3 text-xs leading-relaxed text-muted-ivory">
          <span className="text-brass text-sm font-bold">⚡</span>
          <div>
            <span className="font-semibold text-ink-text">How lifecycle automations work: </span>
            When a lead has had no interaction for{" "}
            <span className="text-brass font-mono">LEAD_INACTIVITY_DAYS</span> (default 14) days, the decay job automatically marks it inactive and triggers any enabled{" "}
            <span className="font-semibold text-ink-text">Lead goes inactive</span> automations — sending your configured message via the chosen channel.
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-ivory-border rounded-xl shadow-editorial overflow-hidden">
          {fetching ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-brass animate-spin" />
            </div>
          ) : automations.length === 0 ? (
            <div className="text-center py-20 text-muted-ivory">
              <div className="text-2xl mb-3">⚡</div>
              <p>No lifecycle automations active.</p>
              {canWrite && (
                <button onClick={() => setShowCreate(true)} className="mt-3 text-xs text-brass hover:underline uppercase tracking-wider font-mono">
                  Create your first automation →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-ivory-50 text-muted-ivory text-xs font-mono uppercase tracking-wider border-b border-ivory-border">
                    <th className="px-6 py-3.5 font-semibold">Name</th>
                    <th className="px-6 py-3.5 font-semibold">Trigger</th>
                    <th className="px-6 py-3.5 font-semibold">Channel</th>
                    <th className="px-6 py-3.5 font-semibold">Template</th>
                    <th className="px-6 py-3.5 font-semibold text-center">Status</th>
                    {canWrite && <th className="px-6 py-3.5 text-right"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-border">
                  {automations.map((a, i) => (
                    <tr 
                      key={a.id} 
                      className={`hover:bg-ivory-50/50 transition-colors ${
                        i % 2 === 1 ? "bg-ivory-100/30" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-ink-text text-sm">{a.name}</td>
                      <td className="px-6 py-4 text-muted-ivory text-xs font-mono uppercase tracking-wider">Lead goes inactive</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
                          {CHANNEL_ICON[a.actionConfig.channel] ?? "•"} {a.actionConfig.channel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-ivory text-xs max-w-xs truncate font-mono">
                        {a.actionConfig.template}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {canWrite ? (
                          <button
                            onClick={() => handleToggle(a)}
                            disabled={toggling === a.id}
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                              a.enabled ? "bg-moss" : "bg-ivory-100 border border-ivory-border"
                            }`}
                          >
                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${a.enabled ? "translate-x-4.5 bg-white" : "translate-x-0.5 bg-muted-ivory"}`} />
                          </button>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${a.enabled ? "bg-moss" : "bg-muted-ivory"}`} />
                            {a.enabled ? "Enabled" : "Disabled"}
                          </span>
                        )}
                      </td>
                      {canWrite && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDelete(a.id, a.name)}
                            disabled={deleting === a.id}
                            className="rounded-lg border border-brick/30 bg-white px-3 py-1.5 text-xs font-mono uppercase tracking-wide text-brick transition-colors hover:bg-brick/5 active:scale-[0.98] disabled:opacity-50"
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

      {/* Create Modal - Ink 900 */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70"
            onClick={() => setShowCreate(false)}
          >
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-ink-900 border border-ink-border rounded-2xl p-8 shadow-2xl text-ivory-text space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-serif text-ivory-text">New Automation</h2>
                <button onClick={() => setShowCreate(false)} className="text-muted-ink hover:text-ivory-text transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createError && (
                <div className="rounded-lg border border-brick/20 bg-brick/5 p-3 text-sm text-brick flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Automation Name <span className="text-brick">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                    placeholder="Re-engage inactive leads"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Trigger</label>
                  <div className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-xs font-mono text-muted-ink">
                    Lead goes inactive (no interaction for {"{"}LEAD_INACTIVITY_DAYS{"}"} days)
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Action</label>
                  <div className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-xs font-mono text-muted-ink">
                    Send message to lead
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Channel <span className="text-brick">*</span></label>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm({ ...form, channel: e.target.value as typeof CHANNELS[number] })}
                    className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                  >
                    {CHANNELS.map((ch) => (
                      <option key={ch} value={ch} style={{ background: "#1B1B21" }}>{CHANNEL_ICON[ch]} {ch}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Message Template <span className="text-brick">*</span></label>
                  <textarea
                    value={form.template}
                    onChange={(e) => setForm({ ...form, template: e.target.value })}
                    required
                    rows={3}
                    className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30 resize-none"
                    placeholder="Hi, we noticed we haven't connected in a while. Would you like to catch up?"
                  />
                  <p className="text-[10px] text-muted-ink mt-1.5">This exact text will be sent to the lead when the trigger fires.</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit" 
                    disabled={creating} 
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brass hover:bg-brass-hover text-white transition-colors active:scale-[0.98] disabled:opacity-60"
                  >
                    {creating ? "Creating..." : "Create Automation"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowCreate(false)} 
                    disabled={creating} 
                    className="py-2.5 px-5 rounded-lg text-sm font-medium border border-ink-border text-ivory-text hover:bg-ink-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
