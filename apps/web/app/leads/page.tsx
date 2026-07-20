"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { AlertCircle, Loader2, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  priority: string;
  score: number;
  source: string | null;
  isActive: boolean;
  optedOut: boolean;
  originChannel: string | null;
  lastChannel: string | null;
  lastInteractionAt: string | null;
  createdAt: string;
  owner: { id: number; name: string; email: string } | null;
  client: { id: number; name: string; accountId: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  no_reply: "bg-muted-ink",
  contacted: "bg-brass",
  qualified: "bg-moss",
  unreachable: "bg-ochre",
  lost: "bg-brick",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-muted-ivory",
  medium: "text-ochre",
  high: "text-brick",
};

const STATUSES = ["no_reply", "contacted", "qualified", "unreachable", "lost"];

export default function LeadsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", source: "", priority: "low", clientId: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const fetchLeads = useCallback(async () => {
    setFetching(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (activeFilter !== "") params.set("isActive", activeFilter);
      const res = await fetch(`${API_URL}/leads?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load leads.");
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFetching(false);
    }
  }, [page, statusFilter, activeFilter]);

  useEffect(() => { if (!loading && user) fetchLeads(); }, [fetchLeads, loading, user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) { setAddError("Name is required."); return; }
    setAdding(true);
    setAddError("");
    try {
      const body: any = {
        name: addForm.name,
        email: addForm.email || null,
        phone: addForm.phone || null,
        source: addForm.source || null,
        priority: addForm.priority,
        clientId: addForm.clientId ? parseInt(addForm.clientId) : null,
      };
      const res = await fetch(`${API_URL}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create lead.");
      setShowAdd(false);
      setAddForm({ name: "", email: "", phone: "", source: "", priority: "low", clientId: "" });
      fetchLeads();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading || !user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-ivory-border gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
              <span className="w-1.5 h-1.5 rounded-full bg-brass" />
              Leads Management
            </div>
            <h1 className="text-3xl font-serif tracking-tight text-ink-text">
              Leads List
            </h1>
            <p className="text-muted-ivory text-sm mt-1">{total} total leads in organization</p>
          </div>
          
          <button
            onClick={() => { setShowAdd(true); setAddError(""); }}
            className="inline-flex items-center gap-2 rounded-lg bg-brass px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brass-hover active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setStatusFilter(""); setPage(1); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wide border transition-colors ${
              statusFilter === "" && activeFilter === "" 
                ? "bg-brass text-white border-brass" 
                : "bg-white border-ivory-border text-ink-text hover:bg-ivory-100"
            }`}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setActiveFilter(""); setPage(1); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wide border transition-colors ${
                statusFilter === s 
                  ? "bg-brass text-white border-brass" 
                  : "bg-white border-ivory-border text-ink-text hover:bg-ivory-100"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[s]}`} />
              {s.replace("_", " ")}
            </button>
          ))}
          <button
            onClick={() => { setActiveFilter(activeFilter === "true" ? "" : "true"); setStatusFilter(""); setPage(1); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wide border transition-colors ${
              activeFilter === "true" 
                ? "bg-moss text-white border-moss" 
                : "bg-white border-ivory-border text-ink-text hover:bg-ivory-100"
            }`}
          >
            Active only
          </button>
          <button
            onClick={() => { setActiveFilter(activeFilter === "false" ? "" : "false"); setStatusFilter(""); setPage(1); }}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wide border transition-colors ${
              activeFilter === "false" 
                ? "bg-ochre text-white border-ochre" 
                : "bg-white border-ivory-border text-ink-text hover:bg-ivory-100"
            }`}
          >
            Inactive
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-brick/20 bg-brick/5 p-4 text-sm text-brick flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Table Card */}
        <div className="bg-white border border-ivory-border rounded-xl shadow-editorial overflow-hidden">
          {fetching ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-brass animate-spin" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-20 text-muted-ivory">No leads found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-ivory-50 text-muted-ivory text-xs font-mono uppercase tracking-wider border-b border-ivory-border">
                    <th className="px-6 py-3.5 font-semibold">Lead</th>
                    <th className="px-6 py-3.5 font-semibold">Status</th>
                    <th className="px-6 py-3.5 font-semibold">Priority</th>
                    <th className="px-6 py-3.5 font-semibold">Score</th>
                    <th className="px-6 py-3.5 font-semibold">Client</th>
                    <th className="px-6 py-3.5 font-semibold">Last Contact</th>
                    <th className="px-6 py-3.5 font-semibold text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-border">
                  {leads.map((lead, i) => (
                    <tr 
                      key={lead.id} 
                      className={`hover:bg-ivory-50/50 transition-colors ${
                        i % 2 === 1 ? "bg-ivory-100/30" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            lead.isActive ? STATUS_COLORS[lead.status] ?? "bg-muted-ink" : "bg-muted-ivory"
                          }`} />
                          <div>
                            <div className="font-semibold text-ink-text text-sm">{lead.name}</div>
                            <div className="text-xs text-muted-ivory mt-0.5">{lead.email || lead.phone || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[lead.status] ?? "bg-muted-ink"}`} />
                          {lead.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-xs font-mono uppercase tracking-wider font-semibold ${PRIORITY_COLORS[lead.priority] ?? ""}`}>
                        {lead.priority}
                      </td>
                      <td className="px-6 py-4 text-ink-text font-mono text-xs">{lead.score}</td>
                      <td className="px-6 py-4 text-xs text-muted-ivory">
                        {lead.client ? (
                          <Link href={`/clients/${lead.client.id}`} className="text-brass hover:underline">{lead.client.name}</Link>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-ivory font-mono">
                        {lead.lastInteractionAt ? new Date(lead.lastInteractionAt).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-ivory-border bg-white text-xs font-medium text-ink-text transition-colors hover:bg-ivory-100 active:scale-[0.98]"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2">
            <button 
              disabled={page <= 1} 
              onClick={() => setPage((p) => p - 1)} 
              className="px-3.5 py-2 rounded-lg border border-ivory-border bg-white text-xs font-mono uppercase tracking-wide text-ink-text hover:bg-ivory-100 disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            <span className="px-4 py-2 text-muted-ivory text-xs font-mono font-medium">{page} / {pages}</span>
            <button 
              disabled={page >= pages} 
              onClick={() => setPage((p) => p + 1)} 
              className="px-3.5 py-2 rounded-lg border border-ivory-border bg-white text-xs font-mono uppercase tracking-wide text-ink-text hover:bg-ivory-100 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add Lead Modal - Ink 900 */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70"
            onClick={() => setShowAdd(false)}
          >
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-md bg-ink-900 border border-ink-border rounded-2xl p-8 shadow-2xl text-ivory-text space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-serif text-ivory-text">New Lead</h2>
                <button onClick={() => setShowAdd(false)} className="text-muted-ink hover:text-ivory-text transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {addError && (
                <div className="rounded-lg border border-brick/20 bg-brick/5 p-3 text-sm text-brick flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {addError}
                </div>
              )}

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Full Name <span className="text-brick">*</span></label>
                  <input 
                    type="text" 
                    value={addForm.name} 
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} 
                    required 
                    className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30" 
                    placeholder="Jane Smith" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Email</label>
                    <input 
                      type="email" 
                      value={addForm.email} 
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} 
                      className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30" 
                      placeholder="jane@co.com" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Phone</label>
                    <input 
                      type="tel" 
                      value={addForm.phone} 
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} 
                      className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30" 
                      placeholder="+1234567890" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Priority</label>
                    <select 
                      value={addForm.priority} 
                      onChange={(e) => setAddForm({ ...addForm, priority: e.target.value })} 
                      className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                    >
                      <option value="low" style={{ background: "#1B1B21" }}>Low</option>
                      <option value="medium" style={{ background: "#1B1B21" }}>Medium</option>
                      <option value="high" style={{ background: "#1B1B21" }}>High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Source</label>
                    <input 
                      type="text" 
                      value={addForm.source} 
                      onChange={(e) => setAddForm({ ...addForm, source: e.target.value })} 
                      className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30" 
                      placeholder="Website" 
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit" 
                    disabled={adding} 
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brass hover:bg-brass-hover text-white transition-colors active:scale-[0.98] disabled:opacity-60"
                  >
                    {adding ? "Creating..." : "Create Lead"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAdd(false)} 
                    disabled={adding} 
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
