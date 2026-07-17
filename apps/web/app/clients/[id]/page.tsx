"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const STATUS_DOT: Record<string, string> = {
  no_reply: "bg-slate-500",
  contacted: "bg-blue-500",
  qualified: "bg-emerald-500",
  unreachable: "bg-yellow-500",
  lost: "bg-red-500",
};

function AssociatedLeads({ clientId }: { clientId: string }) {
  const [leads, setLeads] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/leads?clientId=${clientId}&limit=10`, { credentials: "include" })
      .then((r) => r.ok ? r.json() : { leads: [] })
      .then((d) => setLeads(d.leads ?? []))
      .finally(() => setFetching(false));
  }, [clientId]);

  return (
    <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <h2 className="text-lg font-bold text-slate-200">Associated Leads</h2>
        <Link href={`/leads`} className="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all →</Link>
      </div>
      {fetching ? (
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 border-4 border-t-violet-500 border-violet-200 rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center text-slate-500 py-8 bg-slate-950/30 rounded-xl border border-slate-800 border-dashed">
          No leads linked to this client yet.
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead: any) => (
            <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/30 border border-slate-800/60 hover:border-violet-500/30 hover:bg-slate-800/40 transition-all group">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[lead.status] ?? "bg-slate-500"}`} />
                <div>
                  <div className="text-sm font-semibold text-slate-200 group-hover:text-violet-300 transition-colors">{lead.name}</div>
                  <div className="text-xs text-slate-500">{lead.email || lead.phone || "—"}</div>
                </div>
              </div>
              <span className="text-xs text-slate-500 capitalize">{lead.status.replace("_", " ")}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

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
  updatedAt: string;
}

const INDUSTRIES = [
  "Technology", "Finance", "Healthcare", "Retail", "Manufacturing",
  "Education", "Real Estate", "Media", "Transportation", "Other",
];

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<Partial<Client>>({});

  const fetchClient = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/clients/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Client not found.");
      const data = await res.json();
      setClient(data.data);
      setForm(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClient(); }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body: any = {
        name: form.name,
        industry: form.industry || null,
        website: form.website || null,
        revenue: form.revenue || null,
        employeeCount: form.employeeCount ?? null,
        address: form.address || null,
        description: form.description || null,
      };
      const res = await fetch(`${API_URL}/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Failed to update client.");
      setClient(data.data);
      setForm(data.data);
      setEditing(false);
      setSuccess("Client updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${client?.name}"? This action cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/clients/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || "Failed to delete client.");
      }
      router.push("/clients");
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-12 h-12 border-4 border-t-indigo-500 border-indigo-200 rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || "Client not found."}</p>
          <Link href="/clients" className="text-indigo-400 hover:text-indigo-300">← Back to Clients</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-200 py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back nav */}
        <Link href="/clients" className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Clients
        </Link>

        {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{error}</div>}
        {success && <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-400">{success}</div>}

        {/* Header card */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-100">{client.name}</h1>
                <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-2 py-1 rounded-md">{client.accountId}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!editing && (
                <button
                  onClick={() => { setEditing(true); setError(""); }}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all"
                >
                  Edit
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>

        {/* Detail / Edit form */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 mb-6">Account Details</h2>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Company Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Industry</label>
                  <select
                    value={form.industry || ""}
                    onChange={(e) => setForm({ ...form, industry: e.target.value || null })}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">No industry</option>
                    {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Website</label>
                  <input
                    type="url"
                    value={form.website || ""}
                    onChange={(e) => setForm({ ...form, website: e.target.value || null })}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Employee Count</label>
                  <input
                    type="number"
                    value={form.employeeCount ?? ""}
                    onChange={(e) => setForm({ ...form, employeeCount: e.target.value ? parseInt(e.target.value) : null })}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="250"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Annual Revenue ($)</label>
                  <input
                    type="number"
                    value={form.revenue ?? ""}
                    onChange={(e) => setForm({ ...form, revenue: e.target.value || null })}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
                  <input
                    type="text"
                    value={form.address || ""}
                    onChange={(e) => setForm({ ...form, address: e.target.value || null })}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="123 Main St"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value || null })}
                  rows={3}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm resize-none"
                  placeholder="Account description..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setForm(client); setError(""); }}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 transition-all shadow-md disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              {[
                { label: "Industry", value: client.industry },
                { label: "Website", value: client.website, link: true },
                { label: "Employee Count", value: client.employeeCount?.toLocaleString() },
                { label: "Annual Revenue", value: client.revenue ? `$${parseFloat(client.revenue).toLocaleString()}` : null },
                { label: "Address", value: client.address },
                { label: "Created", value: new Date(client.createdAt).toLocaleDateString() },
              ].map(({ label, value, link }) => (
                <div key={label}>
                  <span className="text-slate-500 block text-xs mb-0.5">{label}</span>
                  {value
                    ? (link
                      ? <a href={value as string} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">{(value as string).replace(/^https?:\/\//, "")}</a>
                      : <span className="text-slate-200 font-medium">{value}</span>)
                    : <span className="text-slate-600">—</span>}
                </div>
              ))}
              {client.description && (
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block text-xs mb-0.5">Description</span>
                  <p className="text-slate-300">{client.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Associated Leads */}
        <AssociatedLeads clientId={id} />
      </div>
    </div>
  );
}
