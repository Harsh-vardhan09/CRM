"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  priority: string;
  score: number;
  notes: string | null;
  source: string | null;
  isActive: boolean;
  optedOut: boolean;
  originChannel: string | null;
  lastChannel: string | null;
  lastInteractionAt: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: number; name: string; email: string } | null;
  client: { id: number; name: string; accountId: string } | null;
}

interface Message {
  id: number;
  direction: "inbound" | "outbound";
  channel: string;
  sender: string;
  recipient: string;
  subject: string | null;
  body: string;
  status: string | null;
  createdAt: string;
}

const CHANNEL_ICON: Record<string, string> = {
  email: "✉",
  sms: "💬",
  whatsapp: "📱",
  other: "📡",
};

const STATUS_BADGE: Record<string, string> = {
  no_reply: "bg-slate-700 text-slate-300",
  contacted: "bg-blue-500/20 text-blue-300",
  qualified: "bg-emerald-500/20 text-emerald-300",
  unreachable: "bg-yellow-500/20 text-yellow-300",
  lost: "bg-red-500/20 text-red-300",
};

const LEAD_STATUSES = ["no_reply", "contacted", "qualified", "unreachable", "lost"];
const LEAD_PRIORITIES = ["low", "medium", "high"];

export default function LeadDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({});

  // Compose state
  const [channel, setChannel] = useState<"EMAIL" | "SMS" | "WHATSAPP">("EMAIL");
  const [composeBody, setComposeBody] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchLead = async () => {
    try {
      const res = await fetch(`${API_URL}/leads/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Lead not found.");
      const data = await res.json();
      setLead(data.data);
      setForm(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`${API_URL}/leads/${id}/messages`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.data ?? []);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchLead();
      fetchMessages();
    }
  }, [id, authLoading, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          phone: form.phone || null,
          status: form.status,
          priority: form.priority,
          score: form.score,
          notes: form.notes || null,
          source: form.source || null,
          isActive: form.isActive,
          optedOut: form.optedOut,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed.");
      setLead(data.data);
      setForm(data.data);
      setEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete lead "${lead?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/leads/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed.");
      }
      router.push("/leads");
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeBody.trim()) { setSendError("Message body is required."); return; }
    setSending(true);
    setSendError("");
    try {
      const payload: any = { channel, body: composeBody };
      if (channel === "EMAIL" && composeSubject) payload.subject = composeSubject;
      const res = await fetch(`${API_URL}/leads/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed.");
      setComposeBody("");
      setComposeSubject("");
      fetchMessages();
    } catch (err: any) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-12 h-12 border-4 border-t-violet-500 border-violet-200 rounded-full animate-spin" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || "Lead not found."}</p>
          <Link href="/leads" className="text-violet-400 hover:text-violet-300">← Back to Leads</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-200 py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="max-w-5xl mx-auto space-y-6">
        <Link href="/leads" className="inline-flex items-center text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Leads
        </Link>

        {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{error}</div>}

        {/* Lead header */}
        <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shadow-md">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-100">{lead.name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[lead.status] ?? "bg-slate-700 text-slate-300"}`}>
                    {lead.status.replace("_", " ")}
                  </span>
                  {!lead.isActive && (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-300">Inactive</span>
                  )}
                  {lead.optedOut && (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-500/20 text-red-300">Opted Out</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!editing && (
                <button onClick={() => { setEditing(true); setError(""); }} className="px-4 py-2 text-sm font-medium rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500 hover:text-white transition-all">
                  Edit
                </button>
              )}
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lead details / edit */}
          <div className="lg:col-span-1 space-y-4">
            <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3 mb-4">Details</h2>

              {editing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Name <span className="text-red-400">*</span></label>
                    <input type="text" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-slate-100 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Email</label>
                    <input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value || null })} className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-slate-100 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Phone</label>
                    <input type="tel" value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value || null })} className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-slate-100 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Status</label>
                    <select value={form.status || "no_reply"} onChange={(e) => setForm({ ...form, status: e.target.value })} className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-slate-100 text-sm outline-none focus:border-violet-500">
                      {LEAD_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Priority</label>
                    <select value={form.priority || "low"} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-slate-100 text-sm outline-none focus:border-violet-500">
                      {LEAD_PRIORITIES.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Score</label>
                    <input type="number" min={0} max={100} value={form.score ?? 0} onChange={(e) => setForm({ ...form, score: parseInt(e.target.value) || 0 })} className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-slate-100 text-sm outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Source</label>
                    <input type="text" value={form.source || ""} onChange={(e) => setForm({ ...form, source: e.target.value || null })} className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-slate-100 text-sm outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Notes</label>
                    <textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value || null })} rows={3} className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-slate-100 text-sm outline-none focus:border-violet-500 resize-none" />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                      <input type="checkbox" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-slate-700 bg-slate-900 text-violet-500" />
                      Active
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                      <input type="checkbox" checked={form.optedOut ?? false} onChange={(e) => setForm({ ...form, optedOut: e.target.checked })} className="rounded border-slate-700 bg-slate-900 text-red-500" />
                      Opted Out
                    </label>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => { setEditing(false); setForm(lead); }} disabled={saving} className="flex-1 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-all">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600 transition-all disabled:opacity-50">
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 text-sm">
                  {[
                    { label: "Email", value: lead.email },
                    { label: "Phone", value: lead.phone },
                    { label: "Source", value: lead.source },
                    { label: "Score", value: String(lead.score) },
                    { label: "Origin Channel", value: lead.originChannel },
                    { label: "Last Channel", value: lead.lastChannel },
                    { label: "Last Contact", value: lead.lastInteractionAt ? new Date(lead.lastInteractionAt).toLocaleString() : "Never" },
                    { label: "Client", value: lead.client?.name, link: lead.client ? `/clients/${lead.client.id}` : undefined },
                    { label: "Owner", value: lead.owner?.name },
                    { label: "Created", value: new Date(lead.createdAt).toLocaleDateString() },
                  ].map(({ label, value, link }) => (
                    <div key={label}>
                      <span className="text-xs text-slate-500 block">{label}</span>
                      {value
                        ? link
                          ? <Link href={link} className="text-indigo-400 hover:text-indigo-300 font-medium">{value}</Link>
                          : <span className="text-slate-200 font-medium">{value}</span>
                        : <span className="text-slate-600">—</span>}
                    </div>
                  ))}
                  {lead.notes && (
                    <div>
                      <span className="text-xs text-slate-500 block">Notes</span>
                      <p className="text-slate-300 text-xs mt-0.5 whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Interaction timeline + compose */}
          <div className="lg:col-span-2 flex flex-col space-y-4">
            {/* Timeline */}
            <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl shadow-xl flex flex-col" style={{ minHeight: "400px" }}>
              <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 px-6 py-4">Interaction Timeline</h2>
              <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "420px" }}>
                {messagesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-t-violet-500 border-violet-200 rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-600 py-12">No interactions yet. Send a message below.</div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 space-y-1 ${msg.direction === "outbound" ? "bg-violet-600/30 border border-violet-500/20" : "bg-slate-800/60 border border-slate-700/50"}`}>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span>{CHANNEL_ICON[msg.channel] ?? "•"}</span>
                          <span className="capitalize">{msg.channel}</span>
                          {msg.status && <span className="opacity-60">· {msg.status}</span>}
                          <span className="ml-auto">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        {msg.subject && <div className="text-xs font-semibold text-slate-300">{msg.subject}</div>}
                        <p className="text-sm text-slate-100 whitespace-pre-wrap">{msg.body}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Compose */}
            {!lead.optedOut ? (
              <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                <h3 className="text-sm font-bold text-slate-200 mb-3">Send Message</h3>
                {sendError && <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/30 p-2 text-xs text-red-400">{sendError}</div>}
                <form onSubmit={handleSend} className="space-y-3">
                  <div className="flex gap-2">
                    {(["EMAIL", "SMS", "WHATSAPP"] as const).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setChannel(ch)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${channel === ch ? "bg-violet-500 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}
                      >
                        {CHANNEL_ICON[ch.toLowerCase()]} {ch}
                      </button>
                    ))}
                  </div>
                  {channel === "EMAIL" && (
                    <input
                      type="text"
                      placeholder="Subject (optional)"
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                    />
                  )}
                  <div className="flex gap-2">
                    <textarea
                      placeholder="Write a message..."
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      rows={2}
                      className="flex-1 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm resize-none"
                    />
                    <button
                      type="submit"
                      disabled={sending}
                      className="self-end px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-semibold hover:from-violet-600 hover:to-indigo-600 transition-all shadow-md disabled:opacity-50"
                    >
                      {sending ? "..." : "Send"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="backdrop-blur-xl bg-slate-900/40 border border-red-500/20 rounded-2xl p-4 text-sm text-red-400 text-center">
                This lead has opted out of communications.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
