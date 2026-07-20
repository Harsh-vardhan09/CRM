"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { LayoutDashboard, Mail, Clock, MessageSquare, AlertCircle } from "lucide-react";

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
  no_reply: "bg-muted-ink",
  contacted: "bg-brass",
  qualified: "bg-moss",
  unreachable: "bg-ochre",
  lost: "bg-brick",
};
const CHANNEL_COLOR: Record<string, string> = {
  EMAIL: "bg-brass",
  SMS: "bg-muted-ivory",
  WHATSAPP: "bg-moss",
  OTHER: "bg-muted-ink",
};
const CHANNEL_ICON: Record<string, string> = {
  email: "✉",
  sms: "💬",
  whatsapp: "📱",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-ivory-border rounded-xl p-6 shadow-editorial">
      <div className="text-muted-ivory text-xs font-mono uppercase tracking-wide mb-1">{label}</div>
      <div className="text-4xl font-serif text-ink-text font-normal">{value}</div>
      {sub && <div className="text-muted-ivory text-xs mt-1.5 font-mono">{sub}</div>}
    </div>
  );
}

function HBar({ label, count, max, colorClass }: { label: string; count: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((count / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-28 text-muted-ivory capitalize text-xs font-mono truncate">{label.replace("_", " ")}</span>
      <div className="flex-1 bg-ivory-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-ink-text font-mono text-xs">{count}</span>
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

  if (authLoading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ivory-50 text-ink-text">
        <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
          <path d="M4 12 L76 12" stroke="#9C7A3C" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
        </svg>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="space-y-3 pb-8 border-b border-ivory-border">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Analytics Dashboard
          </div>
          <h1 className="text-3xl font-serif tracking-tight text-ink-text">
            Analytics Overview
          </h1>
          <p className="text-sm text-muted-ivory">Real-time overview of leads, clients, and message activity.</p>
        </div>

        {error && (
          <div className="rounded-lg border border-brick/20 bg-brick/5 p-4 text-sm text-brick flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {stats && pipeline && (
          <>
            {/* Overview stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Leads" value={stats.leads.total} sub={`${stats.leads.active} active`} />
              <StatCard label="Total Clients" value={stats.clients.total} />
              <StatCard label="Open Tickets" value={stats.tickets.open} />
              <StatCard
                label="Messages This Week"
                value={stats.messages.last7Days.sent + stats.messages.last7Days.received}
                sub={`${stats.messages.last7Days.sent} sent · ${stats.messages.last7Days.received} received`}
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
              <div className="bg-white border border-ivory-border rounded-xl p-6 shadow-editorial space-y-4">
                <h2 className="text-sm font-semibold text-ink-text border-b border-ivory-border pb-3">Lead Pipeline</h2>
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
                          colorClass={STATUS_COLOR[status] ?? "bg-muted-ink"}
                        />
                      ))}
                    </div>
                  );
                })()}
                <div className="pt-2 border-t border-ivory-border text-xs text-muted-ivory font-mono">
                  Total: {pipeline.byStatus.reduce((s, b) => s + b.count, 0)} leads
                </div>
              </div>

              {/* Channel attribution */}
              <div className="bg-white border border-ivory-border rounded-xl p-6 shadow-editorial space-y-4">
                <h2 className="text-sm font-semibold text-ink-text border-b border-ivory-border pb-3">Lead Origin Channel</h2>
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
                          colorClass={CHANNEL_COLOR[channel ?? ""] ?? "bg-muted-ink"}
                        />
                      ))}
                      {rows.length === 0 && <p className="text-muted-ivory text-xs">No data yet.</p>}
                    </div>
                  );
                })()}
                <div className="pt-2 border-t border-ivory-border text-xs text-muted-ivory font-mono">
                  Attribution by first-touch channel
                </div>
              </div>
            </div>

            {/* Priority breakdown */}
            <div className="bg-white border border-ivory-border rounded-xl p-6 shadow-editorial space-y-4">
              <h2 className="text-sm font-semibold text-ink-text border-b border-ivory-border pb-3">Leads by Priority</h2>
              <div className="grid grid-cols-3 gap-4">
                {["high", "medium", "low"].map((p) => {
                  const found = stats.leads.byPriority.find((b) => b.priority === p);
                  const count = found?.count ?? 0;
                  const color = p === "high" ? "text-brick" : p === "medium" ? "text-ochre" : "text-muted-ivory";
                  return (
                    <div key={p} className="text-center bg-ivory-100/50 rounded-lg p-4 border border-ivory-border">
                      <div className={`text-3xl font-serif font-semibold ${color}`}>{count}</div>
                      <div className="text-xs text-muted-ivory font-mono capitalize mt-1.5">{p} priority</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent activity feed */}
            <div className="bg-white border border-ivory-border rounded-xl p-6 shadow-editorial space-y-4">
              <h2 className="text-sm font-semibold text-ink-text border-b border-ivory-border pb-3">Recent Activity</h2>
              {stats.recentActivity.length === 0 ? (
                <p className="text-muted-ivory text-xs py-4 text-center">No messages yet.</p>
              ) : (
                <div className="space-y-2">
                  {stats.recentActivity.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 p-3.5 rounded-lg bg-ivory-100/30 border border-ivory-border hover:border-brass/35 transition-colors">
                      <div className="flex-shrink-0 text-sm mt-0.5">{CHANNEL_ICON[msg.channel] ?? "•"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-ivory mb-1 font-mono">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-ivory-border bg-ivory-100 text-[10px] uppercase font-bold text-muted-ivory">
                            {msg.direction}
                          </span>
                          <span className="capitalize">{msg.channel}</span>
                          {msg.lead && (
                            <Link href={`/leads/${msg.lead.id}`} className="text-brass hover:underline">
                              Lead: {msg.lead.name}
                            </Link>
                          )}
                          {msg.ticket && (
                            <span>Ticket #{msg.ticket.id}</span>
                          )}
                          <span className="ml-auto text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {msg.subject && <div className="text-xs font-semibold text-ink-text mb-0.5">{msg.subject}</div>}
                        <p className="text-xs text-muted-ivory leading-relaxed truncate">{msg.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
