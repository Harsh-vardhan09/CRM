"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

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
  no_reply: "bg-slate-500",
  contacted: "bg-blue-500",
  qualified: "bg-emerald-500",
  unreachable: "bg-yellow-500",
  lost: "bg-red-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-slate-400",
  medium: "text-yellow-400",
  high: "text-red-400",
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
    <div className="relative min-h-screen bg-slate-950 text-slate-200 py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute top-0 left-0 -z-10 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-100 to-violet-400 bg-clip-text text-transparent">
              Leads
            </h1>
            <p className="text-slate-400 text-sm mt-1">{total} total leads</p>
          </div>
          <button
            onClick={() => { setShowAdd(true); setAddError(""); }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white font-semibold text-sm shadow-md hover:from-violet-600 hover:to-indigo-600 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span>New Lead</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setStatusFilter(""); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === "" && activeFilter === "" ? "bg-violet-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setActiveFilter(""); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${statusFilter === s ? "bg-violet-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${STATUS_COLORS[s]}`} />
              {s.replace("_", " ")}
            </button>
          ))}
          <button
            onClick={() => { setActiveFilter(activeFilter === "true" ? "" : "true"); setStatusFilter(""); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeFilter === "true" ? "bg-emerald-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
          >
            Active only
          </button>
          <button
            onClick={() => { setActiveFilter(activeFilter === "false" ? "" : "false"); setStatusFilter(""); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeFilter === "false" ? "bg-yellow-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
          >
            Inactive
          </button>
        </div>

        {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{error}</div>}

        {/* Table */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
          {fetching ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-t-violet-500 border-violet-200 rounded-full animate-spin" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-16 text-slate-500">No leads found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-4 font-semibold">Lead</th>
                    <th className="text-left px-4 py-4 font-semibold">Status</th>
                    <th className="text-left px-4 py-4 font-semibold">Priority</th>
                    <th className="text-left px-4 py-4 font-semibold">Score</th>
                    <th className="text-left px-4 py-4 font-semibold">Client</th>
                    <th className="text-left px-4 py-4 font-semibold">Last Contact</th>
                    <th className="text-right px-6 py-4 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${lead.isActive ? STATUS_COLORS[lead.status] ?? "bg-slate-500" : "bg-slate-700"}`} />
                          <div>
                            <div className="font-semibold text-slate-100">{lead.name}</div>
                            <div className="text-xs text-slate-500">{lead.email || lead.phone || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 capitalize">
                          {lead.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className={`px-4 py-4 text-xs font-semibold capitalize ${PRIORITY_COLORS[lead.priority] ?? ""}`}>
                        {lead.priority}
                      </td>
                      <td className="px-4 py-4 text-slate-300 font-mono text-xs">{lead.score}</td>
                      <td className="px-4 py-4 text-slate-400 text-xs">
                        {lead.client ? (
                          <Link href={`/clients/${lead.client.id}`} className="text-indigo-400 hover:text-indigo-300">{lead.client.name}</Link>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-4 text-slate-500 text-xs">
                        {lead.lastInteractionAt ? new Date(lead.lastInteractionAt).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
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
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs disabled:opacity-50 hover:bg-slate-700">Prev</button>
            <span className="px-3 py-1.5 text-slate-400 text-xs">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs disabled:opacity-50 hover:bg-slate-700">Next</button>
          </div>
        )}
      </div>

      {/* Add Lead Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-md shadow-2xl space-y-5">
            <h2 className="text-xl font-bold text-slate-100">New Lead</h2>
            {addError && <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{addError}</div>}
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name <span className="text-red-400">*</span></label>
                <input type="text" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} required className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm" placeholder="Jane Smith" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm" placeholder="jane@co.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                  <input type="tel" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 sm:text-sm" placeholder="+1234567890" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Priority</label>
                  <select value={addForm.priority} onChange={(e) => setAddForm({ ...addForm, priority: e.target.value })} className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 outline-none focus:border-violet-500 sm:text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Source</label>
                  <input type="text" value={addForm.source} onChange={(e) => setAddForm({ ...addForm, source: e.target.value })} className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500 sm:text-sm" placeholder="Website" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} disabled={adding} className="px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-all">Cancel</button>
                <button type="submit" disabled={adding} className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 transition-all shadow-md disabled:opacity-50">
                  {adding ? "Creating..." : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
