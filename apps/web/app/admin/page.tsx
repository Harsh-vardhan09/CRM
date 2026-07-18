"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { MemoryTraceMesh } from "../components/MemoryTraceMesh";
import { VyorLogo } from "../components/VyorLogo";
import {
  LogOut, Settings, ShieldCheck, Users, UserPlus,
  Building2, Mail, Fingerprint, Clock, CheckCircle2, XCircle,
} from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const PANEL = {
  background: "rgba(237,230,214,0.025)",
  border: "1px solid rgba(237,230,214,0.08)",
};

export default function AdminPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role?.toLowerCase() !== "admin" && user.role?.toLowerCase() !== "super_admin")
        router.push("/user");
    }
  }, [user, loading, router]);

  if (loading || !user || (user.role?.toLowerCase() !== "admin" && user.role?.toLowerCase() !== "super_admin")) {
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

  const moduleCards = [
    ...(user.isSuperAdmin ? [{
      href: "/super-admin",
      label: "Platform",
      desc: "Manage global tenants and company features",
      icon: Building2,
      tint: "#6B5B95",
    }] : []),
    { href: "/admin/roles",        label: "Roles",    desc: "Configure granular access and permissions", icon: ShieldCheck, tint: "#F2A24C" },
    { href: "/admin/team",         label: "Team",     desc: "Manage active users in your organisation",  icon: Users,       tint: "#34E7C4" },
    { href: "/admin/join-requests",label: "Requests", desc: "Review pending employee access requests",   icon: UserPlus,    tint: "#FF6355" },
  ];

  return (
    <div className="min-h-screen bg-[#0A0B10] text-[#EDE6D6] relative overflow-hidden"
      style={{ background: "linear-gradient(to bottom right, #14151F, #0A0B10, #211A34)" }}>
      
      {/* Grain texture */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="max-w-7xl mx-auto p-6 md:p-12 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between pb-10 mb-10 space-y-6 md:space-y-0"
          style={{ borderBottom: "1px solid rgba(237,230,214,0.06)" }}
        >
          <div className="space-y-3">
            {/* Role badge — wax-seal mono, not pill-glow */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md"
              style={{
                background: "rgba(52,231,196,0.07)",
                border: "1px solid rgba(52,231,196,0.18)",
                color: "#34E7C4",
                fontFamily: "var(--font-mono), monospace",
              }}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="text-[11px] uppercase tracking-widest font-medium">
                {user.isSuperAdmin ? "Super Admin" : "Company Admin"}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#EDE6D6]"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
              Control Center
            </h1>
            <p className="text-[#A8A0B0] text-base font-light max-w-lg">
              Manage organisation settings, security roles, and user pipelines with full administrative access.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 opacity-60">
              <VyorLogo size={28} />
              <span style={{ fontFamily: "var(--font-fraunces), Georgia, serif", color: "#6E6678" }}
                className="text-sm">VYOR</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={logout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "rgba(237,230,214,0.04)",
                border: "1px solid rgba(237,230,214,0.10)",
                color: "#A8A0B0",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = "#FF6355"; e.currentTarget.style.borderColor = "rgba(255,99,85,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#A8A0B0"; e.currentTarget.style.borderColor = "rgba(237,230,214,0.10)"; }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </motion.button>
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <motion.div variants={container as any} initial="hidden" animate="show"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Identity Card — col-span 4 */}
          <motion.div variants={item as any} className="lg:col-span-4">
            <div className="rounded-2xl p-8 relative overflow-hidden h-full" style={PANEL}>
              <div className="absolute top-0 left-8 right-8 h-px bg-[#EDE6D6]/10" />

              <h3 className="text-sm font-semibold text-[#EDE6D6] flex items-center gap-2 mb-7">
                <Fingerprint className="w-4 h-4" style={{ color: "#34E7C4" }} />
                Identity
              </h3>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-8">
                <div className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-semibold"
                  style={{ background: "linear-gradient(to br, rgba(52,231,196,0.3), rgba(107,91,149,0.3))", border: "1px solid rgba(52,231,196,0.2)", color: "#EDE6D6" }}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[#EDE6D6] font-semibold text-lg">{user.name}</p>
                  <p style={{ fontFamily: "var(--font-mono), monospace", color: "#34E7C4", fontSize: "11px" }}
                    className="uppercase tracking-wider mt-0.5">
                    {user.role?.replace("_", " ")}
                  </p>
                </div>
              </div>

              {/* Ledger rows — mono data, not icon rows */}
              <div className="space-y-3 pt-5" style={{ borderTop: "1px solid rgba(237,230,214,0.06)" }}>
                {[
                  { label: "Email", value: user.email, icon: Mail },
                  { label: "Org ID", value: user.orgId || "N/A", icon: Building2 },
                  { label: "Last Login", value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "New Session", icon: Clock },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <row.icon className="w-3.5 h-3.5" style={{ color: "#6E6678" }} />
                      <span className="text-xs text-[#6E6678]">{row.label}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono), monospace", color: "#A8A0B0", fontSize: "11px" }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* System Capabilities — col-span 8 */}
          <motion.div variants={item as any} className="lg:col-span-8">
            <div className="rounded-2xl p-8 relative overflow-hidden h-full" style={PANEL}>
              <div className="absolute top-0 left-8 right-8 h-px bg-[#EDE6D6]/10" />

              <h3 className="text-sm font-semibold text-[#EDE6D6] flex items-center gap-2 mb-7">
                <Settings className="w-4 h-4" style={{ color: "#6B5B95" }} />
                System Capabilities
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(user.permissions).map(([key, val], idx) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + idx * 0.07 }}
                    className="flex items-center gap-3 p-3.5 rounded-xl"
                    style={{
                      background: val ? "rgba(52,231,196,0.05)" : "rgba(10,11,16,0.4)",
                      border: val ? "1px solid rgba(52,231,196,0.14)" : "1px solid rgba(237,230,214,0.05)",
                    }}
                  >
                    <div className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center"
                      style={{
                        background: val ? "rgba(52,231,196,0.1)" : "rgba(237,230,214,0.04)",
                        border: val ? "1px solid rgba(52,231,196,0.2)" : "1px solid rgba(237,230,214,0.06)",
                        color: val ? "#34E7C4" : "#6E6678",
                      }}>
                      {val ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#EDE6D6] capitalize">{key.replace(/_/g, " ")}</p>
                      <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: "10px", color: val ? "#34E7C4" : "#6E6678" }}>
                        {val ? `Level · ${val}` : "restricted"}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Navigation Module Cards — col-span 12, Memory Mesh behind */}
          <motion.div variants={item as any} className="lg:col-span-12">
            <div className="relative">
              {/* Memory Trace Mesh lives behind this row */}
              <MemoryTraceMesh />

              <div className={`grid gap-4 relative z-10 ${moduleCards.length === 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"}`}>
                {moduleCards.map(card => (
                  <Link key={card.href} href={card.href} className="block">
                    <motion.div
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      className="rounded-2xl p-7 cursor-pointer h-full"
                      style={{
                        background: `rgba(${hexToRgb(card.tint)},0.04)`,
                        border: `1px solid rgba(${hexToRgb(card.tint)},0.14)`,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = `rgba(${hexToRgb(card.tint)},0.08)`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `rgba(${hexToRgb(card.tint)},0.04)`; }}
                    >
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-5"
                        style={{ background: `rgba(${hexToRgb(card.tint)},0.12)`, border: `1px solid rgba(${hexToRgb(card.tint)},0.2)`, color: card.tint }}>
                        <card.icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-semibold text-[#EDE6D6] mb-1.5">{card.label}</h3>
                      <p className="text-xs text-[#6E6678] leading-relaxed">{card.desc}</p>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

// Utility: convert hex to RGB triplet for rgba() usage
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
