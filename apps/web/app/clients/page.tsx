"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";
import { Plus, X, Search, Briefcase, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Client {
  id: number;
  accountId: string;
  name: string;
  industry: string | null;
  website: string | null;
  revenue: string | null;
  employeeCount: number | null;
  address: string | null;
  description: string | null;
  companyId: number;
  ownerId: number | null;
  createdAt: string;
}

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Retail", "Manufacturing",
  "Education", "Real Estate", "Media", "Transportation", "Other",
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New client form state
  const [form, setForm] = useState({
    name: "",
    industry: "",
    website: "",
    revenue: "",
    employeeCount: "",
    address: "",
    description: "",
  });

  const fetchClients = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (industryFilter) params.set("industry", industryFilter);
      const res = await fetch(`${API_URL}/clients?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch clients.");
      const data = await res.json();
      setClients(data.data || []);
      setPages(data.pagination?.totalPages ?? 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, [page, industryFilter]);

  // Reset to page 1 when industry filter changes
  useEffect(() => {
    setPage(1);
  }, [industryFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Client name is required."); return; }
    setSubmitting(true);
    setError("");
    try {
      const body: any = { name: form.name };
      if (form.industry) body.industry = form.industry;
      if (form.website) body.website = form.website;
      if (form.revenue) body.revenue = form.revenue;
      if (form.employeeCount) body.employeeCount = parseInt(form.employeeCount);
      if (form.address) body.address = form.address;
      if (form.description) body.description = form.description;

      const res = await fetch(`${API_URL}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Failed to create client.");
      setSuccess(`Client "${data.data.name}" created (${data.data.accountId}).`);
      setShowModal(false);
      setForm({ name: "", industry: "", website: "", revenue: "", employeeCount: "", address: "", description: "" });
      fetchClients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-ivory-border gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
              <Briefcase className="w-3.5 h-3.5" />
              Clients Directory
            </div>
            <h1 className="text-3xl font-serif tracking-tight text-ink-text">
              Clients List
            </h1>
            <p className="mt-2 text-sm text-muted-ivory">Manage your company accounts and client relationships.</p>
          </div>
          
          <button
            onClick={() => { setShowModal(true); setError(""); setSuccess(""); }}
            className="inline-flex items-center gap-2 rounded-lg bg-brass px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brass-hover active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Client</span>
          </button>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-lg text-sm flex items-center gap-3 border border-brick/20 bg-brick/5 text-brick">
              <AlertCircle className="w-4 h-4" /> {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-lg text-sm flex items-center gap-3 border border-moss/20 bg-moss/5 text-moss">
              <CheckCircle2 className="w-4 h-4" /> {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-ivory" />
            </div>
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-lg border border-ivory-border bg-white pl-10 pr-4 py-2.5 text-xs text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
            />
          </div>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="rounded-lg border border-ivory-border bg-white px-4 py-2.5 text-xs text-ink-text outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-ivory-border rounded-xl shadow-editorial overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ivory-50 text-muted-ivory text-xs font-mono uppercase tracking-wider border-b border-ivory-border">
                  <th className="px-6 py-3.5 font-semibold">Account</th>
                  <th className="px-6 py-3.5 font-semibold">Industry</th>
                  <th className="px-6 py-3.5 font-semibold">Website</th>
                  <th className="px-6 py-3.5 font-semibold">Employees</th>
                  <th className="px-6 py-3.5 font-semibold">Revenue</th>
                  <th className="px-6 py-3.5 font-semibold text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-border">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-ivory text-sm">Loading clients...</td></tr>
                ) : clients.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-ivory text-sm">No clients found.</td></tr>
                ) : clients.map((client, i) => (
                  <tr 
                    key={client.id} 
                    className={`hover:bg-ivory-50/50 transition-colors ${
                      i % 2 === 1 ? "bg-ivory-100/30" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-ivory-100 border border-ivory-border rounded-full flex items-center justify-center text-ink-text font-bold text-sm font-serif shadow-editorial">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-ink-text">{client.name}</div>
                          <div className="text-xs text-muted-ivory font-mono mt-0.5">{client.accountId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-ivory font-mono uppercase tracking-wide">{client.industry || "—"}</td>
                    <td className="px-6 py-4 text-xs">
                      {client.website ? (
                        <a href={client.website} target="_blank" rel="noreferrer" className="text-brass hover:underline font-mono">
                          {client.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-muted-ivory">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-ivory font-mono">{client.employeeCount ?? "—"}</td>
                    <td className="px-6 py-4 text-xs text-muted-ivory font-mono">
                      {client.revenue ? `$${parseFloat(client.revenue).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/clients/${client.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-ivory-border bg-white text-xs font-medium text-ink-text transition-colors hover:bg-ivory-100 active:scale-[0.98]"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

      {/* Add Client Modal - Ink 900 */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70"
            onClick={() => { setShowModal(false); setError(""); }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-ink-900 border border-ink-border rounded-2xl p-8 shadow-2xl text-ivory-text"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6 border-b border-ink-border pb-4">
                <h3 className="text-lg font-serif text-white">Add New Client</h3>
                <button onClick={() => { setShowModal(false); setError(""); }} className="text-muted-ink hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-brick/20 bg-brick/5 p-3 text-sm text-brick flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Company Name <span className="text-brick">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                    placeholder="Acme Corp"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Industry</label>
                    <select
                      value={form.industry}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                    >
                      <option value="" style={{ background: "#1B1B21" }}>Select industry</option>
                      {INDUSTRIES.map((ind) => <option key={ind} value={ind} style={{ background: "#1B1B21" }}>{ind}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Employees</label>
                    <input
                      type="number"
                      value={form.employeeCount}
                      onChange={(e) => setForm({ ...form, employeeCount: e.target.value })}
                      className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                      placeholder="250"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Website</label>
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                      className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Annual Revenue ($)</label>
                    <input
                      type="number"
                      value={form.revenue}
                      onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                      className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                      placeholder="1000000"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                    placeholder="123 Main St, City, Country"
                  />
                </div>
                
                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30 resize-none"
                    placeholder="Brief description of this account..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-ink-border">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brass hover:bg-brass-hover text-white transition-colors active:scale-[0.98] disabled:opacity-60"
                  >
                    {submitting ? "Creating..." : "Create Client"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setError(""); }}
                    disabled={submitting}
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
