"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  leads: {
    total: number;
    active: number;
    inactive: number;
    byStatus: { status: string; count: number }[];
    byPriority: { priority: string; count: number }[];
  };
  clients: { total: number };
  tickets: { open: number };
  messages: {
    last7Days: { sent: number; received: number };
    last30Days: { sent: number; received: number };
  };
  recentActivity: {
    id: number;
    direction: string;
    channel: string;
    sender: string;
    recipient: string;
    subject: string | null;
    body: string;
    status: string | null;
    createdAt: string;
    lead: { id: number; name: string } | null;
    ticket: { id: number; customerNum: string } | null;
  }[];
}

interface Pipeline {
  byStatus: { status: string; count: number }[];
  byOriginChannel: { channel: string | null; count: number }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_ORDER = ["no_reply", "contacted", "qualified", "unreachable", "lost"];
const STATUS_COLOR: Record<string, string> = {
  no_reply: "bg-slate-500",
  contacted: "bg-blue-500",
  qualified: "bg-emerald-500",
  unreachable: "bg-yellow-500",
  lost: "bg-red-500",
};
const CHANNEL_COLOR: Record<string, string> = {
  EMAIL: "bg-indigo-500",
  SMS: "bg-violet-500",
  WHATSAPP: "bg-emerald-500",
  OTHER: "bg-slate-500",
};
const CHANNEL_ICON: Record<string, string> = {
  email: "✉",
  sms: "💬",
  whatsapp: "📱",
};

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
      <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-4xl font-extrabold ${accent ?? "text-slate-100"}`}>{value}</div>
      {sub && <div className="text-slate-500 text-xs mt-1">{sub}</div>}
    </div>
  );
}

function HBar({ label, count, max, colorClass }: { label: string; count: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((count / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 text-slate-400 capitalize text-xs truncate">{label.replace("_", " ")}</span>
      <div className="flex-1 bg-slate-800/60 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-slate-300 font-mono text-xs">{count}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    setFetching(true);
    Promise.all([
      fetch(`${API_URL}/dashboard/stats`, { credentials: "include" }),
      fetch(`${API_URL}/dashboard/pipeline`, { credentials: "include" }),
    ])
      .then(async ([sRes, pRes]) => {
        if (!sRes.ok || !pRes.ok) throw new Error("Failed to load dashboard.");
        const [s, p] = await Promise.all([sRes.json(), pRes.json()]);
        setStats(s.data);
        setPipeline(p.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, [authLoading, user]);

  const backLink = user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "super_admin"
    ? "/admin"
    : "/user";

  if (authLoading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="w-12 h-12 border-4 border-t-indigo-500 border-indigo-200 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-200 py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute top-0 left-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-10 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Link href={backLink} className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors mb-4">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Workspace
          </Link>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-100 to-indigo-400 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time overview of leads, clients, and message activity.</p>
        </div>

        {error && <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">{error}</div>}

        {stats && pipeline && (
          <>
            {/* Overview stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Leads" value={stats.leads.total} sub={`${stats.leads.active} active`} accent="text-violet-400" />
              <StatCard label="Total Clients" value={stats.clients.total} accent="text-indigo-400" />
              <StatCard label="Open Tickets" value={stats.tickets.open} accent="text-emerald-400" />
              <StatCard
                label="Messages This Week"
                value={stats.messages.last7Days.sent + stats.messages.last7Days.received}
                sub={`${stats.messages.last7Days.sent} sent · ${stats.messages.last7Days.received} received`}
                accent="text-sky-400"
              />
            </div>

            {/* Secondary stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Active Leads" value={stats.leads.active} />
              <StatCard label="Inactive Leads" value={stats.leads.inactive} />
              <StatCard label="Sent (30d)" value={stats.messages.last30Days.sent} />
              <StatCard label="Received (30d)" value={stats.messages.last30Days.received} />
            </div>

            {/* Pipeline + Channel Attribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pipeline funnel */}
              <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3">Lead Pipeline</h2>
                {(() => {
                  const ordered = STATUS_ORDER.map((s) => {
                    const found = pipeline.byStatus.find((b) => b.status === s);
                    return { status: s, count: found?.count ?? 0 };
                  });
                  const max = Math.max(...ordered.map((o) => o.count), 1);
                  return (
                    <div className="space-y-3">
                      {ordered.map(({ status, count }) => (
                        <HBar
                          key={status}
                          label={status}
                          count={count}
                          max={max}
                          colorClass={STATUS_COLOR[status] ?? "bg-slate-500"}
                        />
                      ))}
                    </div>
                  );
                })()}
                <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-500">
                  Total: {pipeline.byStatus.reduce((s, b) => s + b.count, 0)} leads
                </div>
              </div>

              {/* Channel attribution */}
              <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
                <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3">Lead Origin Channel</h2>
                {(() => {
                  const rows = [...pipeline.byOriginChannel].sort((a, b) => b.count - a.count);
                  const max = Math.max(...rows.map((r) => r.count), 1);
                  return (
                    <div className="space-y-3">
                      {rows.map(({ channel, count }) => (
                        <HBar
                          key={channel ?? "unknown"}
                          label={channel ?? "Unknown"}
                          count={count}
                          max={max}
                          colorClass={CHANNEL_COLOR[channel ?? ""] ?? "bg-slate-600"}
                        />
                      ))}
                      {rows.length === 0 && <p className="text-slate-600 text-sm">No data yet.</p>}
                    </div>
                  );
                })()}
                <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-500">
                  Attribution by first-touch channel
                </div>
              </div>
            </div>

            {/* Priority breakdown */}
            <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3">Leads by Priority</h2>
              <div className="grid grid-cols-3 gap-4">
                {["high", "medium", "low"].map((p) => {
                  const found = stats.leads.byPriority.find((b) => b.priority === p);
                  const count = found?.count ?? 0;
                  const color = p === "high" ? "text-red-400" : p === "medium" ? "text-yellow-400" : "text-slate-400";
                  return (
                    <div key={p} className="text-center bg-slate-950/40 rounded-xl p-4 border border-slate-800/60">
                      <div className={`text-3xl font-extrabold ${color}`}>{count}</div>
                      <div className="text-xs text-slate-500 capitalize mt-1">{p} priority</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent activity feed */}
            <div className="backdrop-blur-xl bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-3">Recent Activity</h2>
              {stats.recentActivity.length === 0 ? (
                <p className="text-slate-600 text-sm py-4 text-center">No messages yet.</p>
              ) : (
                <div className="space-y-2">
                  {stats.recentActivity.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/30 border border-slate-800/40 hover:border-slate-700/60 transition-all">
                      <div className="flex-shrink-0 text-lg mt-0.5">{CHANNEL_ICON[msg.channel] ?? "•"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${msg.direction === "outbound" ? "bg-violet-500/10 text-violet-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                            {msg.direction}
                          </span>
                          <span className="capitalize">{msg.channel}</span>
                          {msg.lead && (
                            <Link href={`/leads/${msg.lead.id}`} className="text-indigo-400 hover:text-indigo-300">
                              Lead: {msg.lead.name}
                            </Link>
                          )}
                          {msg.ticket && (
                            <span>Ticket #{msg.ticket.id}</span>
                          )}
                          <span className="ml-auto">{new Date(msg.createdAt).toLocaleString()}</span>
                        </div>
                        {msg.subject && <div className="text-xs font-semibold text-slate-300 mb-0.5">{msg.subject}</div>}
                        <p className="text-sm text-slate-400 truncate">{msg.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
