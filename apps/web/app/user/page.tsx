"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Mail, Building2, Clock } from "lucide-react";

const PANEL = {
  background: "rgba(237,230,214,0.025)",
  border: "1px solid rgba(237,230,214,0.08)",
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const MODULES = [
  { href: "/dashboard",   label: "Dashboard",    desc: "Analytics overview: lead pipeline, channel attribution, and message activity.", tint: "#34E7C4" },
  { href: "/automations", label: "Automations",  desc: "Auto-message inactive leads via configurable trigger rules.",                   tint: "#6B5B95" },
  { href: "/support",     label: "Support Inbox",desc: "View and reply to customer tickets across all channels.",                       tint: "#F2A24C" },
  { href: "/clients",     label: "Clients",      desc: "Manage client accounts, contacts, and account relationships.",                  tint: "#34E7C4" },
  { href: "/leads",       label: "Leads",        desc: "Track prospects, manage engagement pipelines, and send cross-channel messages.", tint: "#6B5B95" },
];

export default function UserPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role?.toLowerCase() === "admin" || user.role?.toLowerCase() === "super_admin")
        router.push("/admin");
    }
  }, [user, loading, router]);

  if (loading || !user || user.role?.toLowerCase() === "admin" || user.role?.toLowerCase() === "super_admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0B10]">
        <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
          <motion.path
            d="M4 12 L76 12"
            stroke="#34E7C4" strokeWidth="2" strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(to bottom right, #14151F, #0A0B10, #211A34)" }}>

      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="max-w-6xl mx-auto p-6 md:p-12 relative z-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between pb-8 mb-8 space-y-4 md:space-y-0"
          style={{ borderBottom: "1px solid rgba(237,230,214,0.06)" }}>
          <div>
            <h1 className="text-4xl font-light text-[#EDE6D6] tracking-tight"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
              Sales Workspace
            </h1>
            <p className="text-sm text-[#6E6678] mt-1.5">Manage leads, opportunities, and track communication pipelines</p>
          </div>
          <button onClick={logout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all self-start md:self-auto"
            style={{ background: "rgba(237,230,214,0.04)", border: "1px solid rgba(237,230,214,0.10)", color: "#A8A0B0" }}
            onMouseEnter={e => { e.currentTarget.style.color = "#FF6355"; e.currentTarget.style.borderColor = "rgba(255,99,85,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#A8A0B0"; e.currentTarget.style.borderColor = "rgba(237,230,214,0.10)"; }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </motion.div>

        <motion.div variants={container as any} initial="hidden" animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Profile card */}
          <motion.div variants={item as any}>
            <div className="rounded-2xl p-7 relative overflow-hidden h-full" style={PANEL}>
              <div className="absolute top-0 left-7 right-7 h-px bg-[#EDE6D6]/10" />
              <h3 className="text-sm font-semibold text-[#EDE6D6] mb-6">Sales Representative</h3>

              <div className="flex items-center gap-4 mb-7">
                <div className="h-14 w-14 rounded-full flex items-center justify-center text-xl font-semibold"
                  style={{ background: "linear-gradient(to br, rgba(107,91,149,0.4), rgba(52,231,196,0.3))", border: "1px solid rgba(107,91,149,0.3)", color: "#EDE6D6" }}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[#EDE6D6] font-semibold">{user.name}</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider mt-1"
                    style={{ fontFamily: "var(--font-mono), monospace", background: "rgba(107,91,149,0.1)", border: "1px solid rgba(107,91,149,0.2)", color: "#6B5B95" }}>
                    {user.role}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4" style={{ borderTop: "1px solid rgba(237,230,214,0.06)" }}>
                {[
                  { label: "Email", value: user.email, icon: Mail },
                  { label: "Org ID", value: user.orgId || "None", icon: Building2 },
                  { label: "Last Session", value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "First Login", icon: Clock },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <row.icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#6E6678" }} />
                      <span className="text-xs text-[#6E6678]">{row.label}</span>
                    </div>
                    <span className="text-right max-w-[55%]"
                      style={{ fontFamily: "var(--font-mono), monospace", color: "#A8A0B0", fontSize: "10px" }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Permissions card */}
          <motion.div variants={item as any} className="md:col-span-2">
            <div className="rounded-2xl p-7 relative overflow-hidden h-full" style={PANEL}>
              <div className="absolute top-0 left-7 right-7 h-px bg-[#EDE6D6]/10" />
              <h3 className="text-sm font-semibold text-[#EDE6D6] mb-6">Role Permissions & System Capabilities</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {Object.entries(user.permissions).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{
                      background: val ? "rgba(52,231,196,0.05)" : "rgba(10,11,16,0.3)",
                      border: val ? "1px solid rgba(52,231,196,0.12)" : "1px solid rgba(237,230,214,0.05)",
                    }}>
                    <div className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center"
                      style={{
                        background: val ? "rgba(52,231,196,0.1)" : "rgba(237,230,214,0.04)",
                        border: val ? "1px solid rgba(52,231,196,0.18)" : "1px solid rgba(237,230,214,0.06)",
                        color: val ? "#34E7C4" : "#6E6678",
                      }}>
                      {val ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold capitalize" style={{ color: val ? "#EDE6D6" : "#6E6678" }}>
                        {key.replace(/_/g, " ")}
                      </p>
                      <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: "9px", color: val ? "#34E7C4" : "#6E6678" }}>
                        {val ? "Granted to Sales Rep" : "requires upgrade"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Annotated upgrade note */}
              <div className="pl-4 border-l relative"
                style={{ borderColor: "rgba(242,162,76,0.35)" }}>
                <span className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full" style={{ background: "#F2A24C" }} />
                <p className="text-xs font-semibold text-[#EDE6D6] mb-1">Sales Representative Note</p>
                <p className="text-xs leading-relaxed" style={{ color: "#A8A0B0" }}>
                  You have access to view and edit leads scoped to your organisation. To perform deletion, export files, build automations, or invite team members, please contact an administrator to upgrade your access role.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Modules */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="mt-8 pt-8" style={{ borderTop: "1px solid rgba(237,230,214,0.06)" }}>
          <h2 className="text-sm font-semibold text-[#A8A0B0] uppercase tracking-widest mb-5"
            style={{ fontFamily: "var(--font-mono), monospace" }}>
            Modules & Applications
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {MODULES.map(mod => (
              <Link key={mod.href} href={mod.href} className="block">
                <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}
                  className="rounded-2xl p-6 cursor-pointer transition-all"
                  style={{
                    background: `rgba(${hexToRgb(mod.tint)},0.04)`,
                    border: `1px solid rgba(${hexToRgb(mod.tint)},0.12)`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `rgba(${hexToRgb(mod.tint)},0.08)`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `rgba(${hexToRgb(mod.tint)},0.04)`; }}>
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: `rgba(${hexToRgb(mod.tint)},0.12)`, border: `1px solid rgba(${hexToRgb(mod.tint)},0.2)` }}>
                    <div className="w-4 h-4 rounded-full" style={{ background: mod.tint, opacity: 0.8 }} />
                  </div>
                  <h3 className="text-sm font-semibold text-[#EDE6D6] mb-1.5">{mod.label}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#6E6678" }}>{mod.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
