"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Plus, X, CheckCircle2, ChevronLeft,
  Loader2, LockKeyhole
} from "lucide-react";
import Link from "next/link";

interface Role { id: number; name: string; }

const PANEL = {
  background: "rgba(237,230,214,0.025)",
  border: "1px solid rgba(237,230,214,0.08)",
};

const PERMISSIONS = [
  { id: "manage_users",          label: "Manage Users" },
  { id: "manage_roles",          label: "Manage Roles" },
  { id: "view_analytics",        label: "View Analytics" },
  { id: "manage_leads",          label: "Manage Leads" },
  { id: "configure_automations", label: "Configure Automations" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function RolesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [roles, setRoles]       = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  const [showCreate, setShowCreate]   = useState(false);
  const [newRoleName, setNewRoleName] = useState("");

  const [editRole, setEditRole]               = useState<Role | null>(null);
  const [selectedPerms, setSelectedPerms]     = useState<string[]>([]);

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role?.toLowerCase() !== "admin" && user.role?.toLowerCase() !== "super_admin")
        router.push("/user");
      else fetchRoles();
    }
  }, [user, loading, router]);

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/roles`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data = await res.json();
      setRoles(data.roles || data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/admin/roles`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoleName }),
      });
      if (!res.ok) throw new Error("Failed to create role");
      setSuccess("Role created");
      setShowCreate(false);
      setNewRoleName("");
      fetchRoles();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); }
  };

  const savePermissions = async () => {
    if (!editRole) return;
    try {
      const res = await fetch(`${API_URL}/admin/roles/${editRole.id}/permissions`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: selectedPerms }),
      });
      if (!res.ok) throw new Error("Failed to update permissions");
      setSuccess("Permissions updated");
      setEditRole(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) { setError(e.message); }
  };

  const togglePerm = (id: string) =>
    setSelectedPerms(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  if (loading || !user) return (
    <div className="flex items-center justify-center min-h-screen bg-[#0A0B10]">
      <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
        <motion.path d="M4 12 L76 12" stroke="#34E7C4" strokeWidth="2" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(to bottom right, #14151F, #0A0B10, #211A34)" }}>

      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="max-w-4xl mx-auto p-6 md:p-12 relative z-10">

        {/* Back + Header */}
        <div className="mb-10">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-[#6E6678] hover:text-[#34E7C4] transition-colors mb-6"
            style={{ fontFamily: "var(--font-mono), monospace" }}>
            <ChevronLeft className="w-3.5 h-3.5" /> back to control center
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md mb-3"
                style={{ background: "rgba(242,162,76,0.07)", border: "1px solid rgba(242,162,76,0.18)", color: "#F2A24C", fontFamily: "var(--font-mono), monospace" }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-widest">Roles & Permissions</span>
              </div>
              <h1 className="text-3xl font-light text-[#EDE6D6] tracking-tight"
                style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                Access Configuration
              </h1>
              <p className="text-sm text-[#6E6678] mt-1.5">Define and assign role-based permissions for your organisation.</p>
            </div>
            <button onClick={() => { setShowCreate(true); setError(""); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
              style={{ background: "rgba(242,162,76,0.12)", border: "1px solid rgba(242,162,76,0.25)", color: "#F2A24C" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(242,162,76,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(242,162,76,0.12)"}>
              <Plus className="w-4 h-4" />
              New Role
            </button>
          </div>
        </div>

        {/* Toasts */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-5 p-4 rounded-lg text-sm flex items-center gap-3"
              style={{ background: "rgba(52,231,196,0.08)", border: "1px solid rgba(52,231,196,0.2)", color: "#34E7C4" }}>
              <CheckCircle2 className="w-4 h-4" /> {success}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mb-5 p-4 rounded-lg text-sm flex items-center gap-3"
              style={{ background: "rgba(255,99,85,0.08)", border: "1px solid rgba(255,99,85,0.2)", color: "#FF6355" }}>
              <X className="w-4 h-4" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roles list */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#34E7C4" }} />
          </div>
        ) : roles.length === 0 ? (
          /* Empty state — unlit mesh node */
          <div className="flex flex-col items-center py-24 gap-4">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="6" stroke="#6E6678" strokeWidth="1.5" />
              <circle cx="24" cy="24" r="2" fill="#6E6678" fillOpacity="0.4" />
            </svg>
            <p className="text-sm text-[#6E6678]" style={{ fontFamily: "var(--font-mono), monospace" }}>no roles defined yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {roles.map((role, i) => (
              <motion.div key={role.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between p-5 rounded-xl group"
                style={PANEL}>
                {/* Annotated border-left style */}
                <div className="flex items-center gap-4">
                  <div className="relative pl-4 border-l" style={{ borderColor: "rgba(242,162,76,0.3)" }}>
                    <span className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full" style={{ background: "#F2A24C" }} />
                    <p className="text-sm font-semibold text-[#EDE6D6]">{role.name}</p>
                    <p style={{ fontFamily: "var(--font-mono), monospace", color: "#6E6678", fontSize: "10px" }}>
                      id · {role.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setEditRole(role); setSelectedPerms([]); setError(""); }}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all opacity-0 group-hover:opacity-100"
                  style={{ background: "rgba(242,162,76,0.1)", border: "1px solid rgba(242,162,76,0.2)", color: "#F2A24C" }}>
                  Edit Permissions
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Role Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(10,11,16,0.85)", backdropFilter: "blur(8px)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl p-8 relative"
              style={{ background: "#14151F", border: "1px solid rgba(237,230,214,0.1)" }}>
              <div className="absolute top-0 left-8 right-8 h-px bg-[#EDE6D6]/10" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-light text-[#EDE6D6]" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                  New Role
                </h2>
                <button onClick={() => setShowCreate(false)} className="text-[#6E6678] hover:text-[#EDE6D6] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <input
                value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
                placeholder="e.g. Account Manager"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none mb-6"
                style={{ background: "rgba(10,11,16,0.6)", border: "1px solid rgba(237,230,214,0.08)", color: "#EDE6D6" }}
                onFocus={e => { e.target.style.borderColor = "rgba(52,231,196,0.4)"; }}
                onBlur={e => { e.target.style.borderColor = "rgba(237,230,214,0.08)"; }}
                onKeyDown={e => { if (e.key === "Enter") createRole(); }}
              />
              <div className="flex gap-3">
                <button onClick={createRole}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-all"
                  style={{ background: "#34E7C4", color: "#0A0B10" }}>
                  Create Role
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="py-2.5 px-5 rounded-xl text-sm text-[#A8A0B0] transition-all"
                  style={{ background: "rgba(237,230,214,0.04)", border: "1px solid rgba(237,230,214,0.08)" }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Permissions Modal */}
      <AnimatePresence>
        {editRole && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(10,11,16,0.85)", backdropFilter: "blur(8px)" }}
            onClick={e => { if (e.target === e.currentTarget) setEditRole(null); }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl p-8 relative"
              style={{ background: "#14151F", border: "1px solid rgba(237,230,214,0.1)" }}>
              <div className="absolute top-0 left-8 right-8 h-px bg-[#EDE6D6]/10" />
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-light text-[#EDE6D6]" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                  {editRole.name}
                </h2>
                <button onClick={() => setEditRole(null)} className="text-[#6E6678] hover:text-[#EDE6D6] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-[#6E6678] mb-6" style={{ fontFamily: "var(--font-mono), monospace" }}>
                configure access permissions
              </p>

              <div className="space-y-2 mb-7">
                {PERMISSIONS.map(perm => {
                  const active = selectedPerms.includes(perm.id);
                  return (
                    <button key={perm.id} onClick={() => togglePerm(perm.id)}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all"
                      style={{
                        background: active ? "rgba(52,231,196,0.07)" : "rgba(10,11,16,0.4)",
                        border: active ? "1px solid rgba(52,231,196,0.2)" : "1px solid rgba(237,230,214,0.06)",
                      }}>
                      <div className="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center"
                        style={{
                          background: active ? "rgba(52,231,196,0.12)" : "rgba(237,230,214,0.04)",
                          border: active ? "1px solid rgba(52,231,196,0.25)" : "1px solid rgba(237,230,214,0.06)",
                          color: active ? "#34E7C4" : "#6E6678",
                        }}>
                        {active ? <CheckCircle2 className="w-4 h-4" /> : <LockKeyhole className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-medium" style={{ color: active ? "#EDE6D6" : "#A8A0B0" }}>
                        {perm.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={savePermissions}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-all"
                  style={{ background: "#34E7C4", color: "#0A0B10" }}>
                  Save Permissions
                </button>
                <button onClick={() => setEditRole(null)}
                  className="py-2.5 px-5 rounded-xl text-sm text-[#A8A0B0]"
                  style={{ background: "rgba(237,230,214,0.04)", border: "1px solid rgba(237,230,214,0.08)" }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
