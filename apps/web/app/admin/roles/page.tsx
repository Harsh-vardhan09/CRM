"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Plus, X, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";

interface Role { id: number; name: string; }

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
    <div className="flex items-center justify-center min-h-screen bg-ivory-50 text-ink-text">
      <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
        <path d="M4 12 L76 12" stroke="#9C7A3C" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />
      </svg>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-ivory-border gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
              <span className="w-1.5 h-1.5 rounded-full bg-brass" />
              Roles & Permissions
            </div>
            <h1 className="text-3xl font-serif tracking-tight text-ink-text">
              Access Configuration
            </h1>
            <p className="text-sm text-muted-ivory">Define and assign role-based permissions for your organisation.</p>
          </div>
          
          {/* New Role CTA (Brass Accent) */}
          <button 
            onClick={() => { setShowCreate(true); setError(""); }}
            className="inline-flex items-center gap-2 rounded-lg bg-brass px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brass-hover active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Role
          </button>
        </div>

        {/* Toasts */}
        <AnimatePresence>
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-lg text-sm flex items-center gap-3 border border-moss/20 bg-moss/5 text-moss">
              <CheckCircle2 className="w-4 h-4" /> {success}
            </motion.div>
          )}
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-lg text-sm flex items-center gap-3 border border-brick/20 bg-brick/5 text-brick">
              <X className="w-4 h-4" /> {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roles List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-brass" />
          </div>
        ) : roles.length === 0 ? (
          <div className="flex flex-col items-center py-24 gap-4">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="6" stroke="#726C61" strokeWidth="1.5" />
              <circle cx="24" cy="24" r="2" fill="#726C61" fillOpacity="0.4" />
            </svg>
            <p className="text-xs font-mono uppercase tracking-wide text-muted-ivory">no roles defined yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {roles.map((role, i) => (
              <motion.div 
                key={role.id}
                initial={{ opacity: 0, y: 8 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="flex items-center justify-between p-5 bg-white border border-ivory-border rounded-xl shadow-editorial group"
              >
                <div className="flex items-center gap-4">
                  <div className="relative pl-4 border-l-2 border-brass">
                    <p className="text-sm font-semibold text-ink-text">{role.name}</p>
                    <p className="font-mono text-[10px] text-muted-ivory mt-0.5">
                      id · {role.id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setEditRole(role); setSelectedPerms([]); setError(""); }}
                  className="px-3 py-1.5 rounded-lg border border-ivory-border bg-white text-xs font-medium text-ink-text transition-colors hover:bg-ivory-100 md:opacity-0 group-hover:opacity-100"
                >
                  Edit Permissions
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Role Modal - Ink 900 */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(18,18,22,0.7)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-md bg-ink-900 border border-ink-border rounded-2xl p-8 text-ivory-text shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)] relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-serif text-ivory-text">
                  New Role
                </h2>
                <button onClick={() => setShowCreate(false)} className="text-muted-ink hover:text-ivory-text transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Role Name</label>
                <input
                  value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
                  placeholder="e.g. Account Manager"
                  className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                  onKeyDown={e => { if (e.key === "Enter") createRole(); }}
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={createRole}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brass hover:bg-brass-hover text-white transition-colors active:scale-[0.98]"
                >
                  Create Role
                </button>
                <button 
                  onClick={() => setShowCreate(false)}
                  className="py-2.5 px-5 rounded-lg text-sm font-medium border border-ink-border text-ivory-text hover:bg-ink-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Permissions Modal - Ink 900 */}
      <AnimatePresence>
        {editRole && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(18,18,22,0.7)" }}
            onClick={e => { if (e.target === e.currentTarget) setEditRole(null); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-md bg-ink-900 border border-ink-border rounded-2xl p-8 text-ivory-text shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)] relative"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-serif text-ivory-text">
                  {editRole.name}
                </h2>
                <button onClick={() => setEditRole(null)} className="text-muted-ink hover:text-ivory-text transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-ink mb-6">
                configure access permissions
              </p>

              <div className="space-y-2 mb-7 max-h-72 overflow-y-auto pr-1">
                {PERMISSIONS.map(perm => {
                  const active = selectedPerms.includes(perm.id);
                  return (
                    <button 
                      key={perm.id} 
                      onClick={() => togglePerm(perm.id)}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-lg text-left transition-colors border ${
                        active 
                          ? "bg-ink-800 border-brass/30" 
                          : "bg-transparent border-ink-border hover:bg-ink-800"
                      }`}
                    >
                      <div className="h-6 w-6 shrink-0 rounded flex items-center justify-center">
                        {active ? (
                          <span className="w-2 h-2 rounded-full bg-moss" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-muted-ink" />
                        )}
                      </div>
                      <span className={`text-xs font-semibold ${active ? "text-ivory-text" : "text-muted-ink"}`}>
                        {perm.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={savePermissions}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brass hover:bg-brass-hover text-white transition-colors active:scale-[0.98]"
                >
                  Save Permissions
                </button>
                <button 
                  onClick={() => setEditRole(null)}
                  className="py-2.5 px-5 rounded-lg text-sm font-medium border border-ink-border text-ivory-text hover:bg-ink-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
