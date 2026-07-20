"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import { ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const STATUS_DOT: Record<string, string> = {
  no_reply: "bg-muted-ivory",
  contacted: "bg-brass",
  qualified: "bg-moss",
  unreachable: "bg-ochre",
  lost: "bg-brick",
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
    <div className="bg-white border border-ivory-border rounded-xl p-6 shadow-editorial">
      <div className="flex items-center justify-between border-b border-ivory-border pb-4 mb-4">
        <h2 className="text-lg font-serif font-bold text-ink-text">Associated Leads</h2>
        <Link href={`/leads`} className="text-xs text-brass hover:underline transition-colors font-medium">View all →</Link>
      </div>
      {fetching ? (
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 border-4 border-t-brass border-ivory-100 rounded-full animate-spin" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center text-muted-ivory py-8 bg-ivory-100 rounded-lg border border-ivory-border border-dashed font-sans">
          No leads linked to this client yet.
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead: any) => (
            <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-center justify-between p-3 rounded-lg bg-ivory-50/50 border border-ivory-border hover:border-brass/20 hover:bg-ivory-100/50 transition-all group">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[lead.status] ?? "bg-muted-ivory"}`} />
                <div>
                  <div className="text-sm font-semibold text-ink-text">{lead.name}</div>
                  <div className="text-xs text-muted-ivory">{lead.email || lead.phone || "—"}</div>
                </div>
              </div>
              <span className="text-xs text-muted-ivory font-mono uppercase tracking-wide">{lead.status.replace("_", " ")}</span>
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
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-t-brass border-ivory-100 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-brick text-lg mb-4 font-sans">{error || "Client not found."}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5">
          <Link href="/clients" className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory hover:bg-ivory-100/70 transition-colors">
            Clients
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-muted-ivory" />
          <span className="text-xs font-mono uppercase tracking-wide text-muted-ivory">{client.name}</span>
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

        {/* Header card */}
        <div className="bg-white border border-ivory-border rounded-xl p-6 shadow-editorial">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-full bg-ivory-100 border border-ivory-border flex items-center justify-center text-ink-text text-2xl font-bold font-serif shadow-editorial">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold text-ink-text">{client.name}</h1>
                <span className="text-xs font-mono text-muted-ivory bg-ivory-100 px-2.5 py-1 rounded-md">{client.accountId}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!editing && (
                <button
                  onClick={() => { setEditing(true); setError(""); }}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-ivory-border bg-white text-ink-text transition-colors hover:bg-ivory-100 active:scale-[0.98]"
                >
                  Edit
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-brick/20 bg-brick/5 text-brick transition-colors hover:bg-brick/10 active:scale-[0.98] disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>

        {/* Detail / Edit form */}
        <div className="bg-white border border-ivory-border rounded-xl p-6 shadow-editorial">
          <h2 className="text-lg font-serif font-bold text-ink-text border-b border-ivory-border pb-4 mb-6">Account Details</h2>

          {editing ? (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase tracking-wide font-mono text-muted-ivory mb-1.5">Company Name <span className="text-brick">*</span></label>
                  <input
                    type="text"
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide font-mono text-muted-ivory mb-1.5">Industry</label>
                  <select
                    value={form.industry || ""}
                    onChange={(e) => setForm({ ...form, industry: e.target.value || null })}
                    className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                  >
                    <option value="">No industry</option>
                    {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide font-mono text-muted-ivory mb-1.5">Website</label>
                  <input
                    type="url"
                    value={form.website || ""}
                    onChange={(e) => setForm({ ...form, website: e.target.value || null })}
                    className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide font-mono text-muted-ivory mb-1.5">Employee Count</label>
                  <input
                    type="number"
                    value={form.employeeCount ?? ""}
                    onChange={(e) => setForm({ ...form, employeeCount: e.target.value ? parseInt(e.target.value) : null })}
                    className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                    placeholder="250"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide font-mono text-muted-ivory mb-1.5">Annual Revenue ($)</label>
                  <input
                    type="number"
                    value={form.revenue ?? ""}
                    onChange={(e) => setForm({ ...form, revenue: e.target.value || null })}
                    className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                    placeholder="1000000"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wide font-mono text-muted-ivory mb-1.5">Address</label>
                  <input
                    type="text"
                    value={form.address || ""}
                    onChange={(e) => setForm({ ...form, address: e.target.value || null })}
                    className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                    placeholder="123 Main St"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide font-mono text-muted-ivory mb-1.5">Description</label>
                <textarea
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value || null })}
                  rows={3}
                  className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30 resize-none"
                  placeholder="Account description..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditing(false); setForm(client); setError(""); }}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-ivory-border bg-white text-ink-text transition-colors hover:bg-ivory-100 active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-brass px-5 py-3 text-white transition-colors hover:bg-brass-hover active:scale-[0.98] disabled:opacity-50"
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
                  <span className="text-muted-ivory block text-xs font-mono uppercase tracking-wide mb-0.5">{label}</span>
                  {value
                    ? (link
                      ? <a href={value as string} target="_blank" rel="noreferrer" className="text-brass hover:underline font-medium">{(value as string).replace(/^https?:\/\//, "")}</a>
                      : <span className="text-ink-text font-medium">{value}</span>)
                    : <span className="text-muted-ivory">—</span>}
                </div>
              ))}
              {client.description && (
                <div className="sm:col-span-2">
                  <span className="text-muted-ivory block text-xs font-mono uppercase tracking-wide mb-0.5">Description</span>
                  <p className="text-ink-text">{client.description}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Associated Leads */}
        <AssociatedLeads clientId={id} />
      </div>
    </DashboardLayout>
  );
}
