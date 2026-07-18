"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, UserPlus, X, Settings2, CheckCircle2,
  ChevronLeft, Loader2, Trash2, Mail,
} from "lucide-react";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
  roleId: number | null;
  status: string;
  createdAt: string;
}
interface Role { id: number; name: string; }

const PANEL = {
  background: "rgba(237,230,214,0.025)",
  border: "1px solid rgba(237,230,214,0.08)",
};
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const INPUT_STYLE = {
  background: "rgba(10,11,16,0.6)",
  border: "1px solid rgba(237,230,214,0.08)",
  color: "#EDE6D6",
  fontFamily: "var(--font-inter), sans-serif",
};

export default function TeamPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers]     = useState<User[]>([]);
  const [roles, setRoles]     = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", roleId: "" });

  const [editUser, setEditUser]   = useState<User | null>(null);
  const [editRoleId, setEditRoleId] = useState<string>("");

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (user.role?.toLowerCase() !== "admin" && !user.isSuperAdmin && user.role?.toLowerCase() !== "super_admin")
        router.push("/admin");
      else fetchData();
    }
  }, [user, loading, router]);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${API_URL}/admin/users`, { credentials: "include" }),
        fetch(`${API_URL}/admin/roles`, { credentials: "include" }),
      ]);
      if (!usersRes.ok || !rolesRes.ok) throw new Error("Failed to fetch team data");
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      setUsers(usersData.data || []);
      setRoles(rolesData.data || []);
      if (rolesData.data?.length > 0)
        setNewUser(prev => ({ ...prev, roleId: String(rolesData.data[0].id) }));
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.roleId) return;
    setError(""); setSuccess("");
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newUser.name, email: newUser.email, password: newUser.password, roleId: Number(newUser.roleId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Failed to create user");
      setSuccess("User created successfully");
      setShowCreateModal(false);
      setNewUser({ name: "", email: "", password: "", roleId: String(roles[0]?.id || "") });
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) { setError(err.message); }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser || !editRoleId) return;
    setError(""); setSuccess("");
    try {
      const res = await fetch(`${API_URL}/admin/users/${editUser.id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ roleId: Number(editRoleId) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Failed to update role");
      setSuccess(`Role updated for ${editUser.name}`);
      setEditUser(null);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) { setError(err.message); }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Remove ${userName} from the organisation?`)) return;
    setError(""); setSuccess("");
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Failed to delete user");
      setSuccess(`${userName} removed`);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) { setError(err.message); }
  };

  const getRoleName = (roleId: number | null) => {
    if (!roleId) return "No Role";
    return roles.find(r => r.id === roleId)?.name.replace(/_/g, " ") || "Unknown";
  };

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

      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="max-w-6xl mx-auto p-6 md:p-12 relative z-10">

        {/* Header */}
        <div className="mb-10">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-[#6E6678] hover:text-[#34E7C4] transition-colors mb-6"
            style={{ fontFamily: "var(--font-mono), monospace" }}>
            <ChevronLeft className="w-3.5 h-3.5" /> back to control center
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md mb-3"
                style={{ background: "rgba(52,231,196,0.07)", border: "1px solid rgba(52,231,196,0.18)", color: "#34E7C4", fontFamily: "var(--font-mono), monospace" }}>
                <Users className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-widest">Team Management</span>
              </div>
              <h1 className="text-3xl font-light text-[#EDE6D6] tracking-tight"
                style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                Organisation Members
              </h1>
              <p className="text-sm text-[#6E6678] mt-1.5">Manage users, roles, and active sessions.</p>
            </div>
            <button onClick={() => { setShowCreateModal(true); setError(""); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium active:scale-[0.98] transition-all self-start"
              style={{ background: "rgba(52,231,196,0.1)", border: "1px solid rgba(52,231,196,0.22)", color: "#34E7C4" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(52,231,196,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(52,231,196,0.1)"}>
              <UserPlus className="w-4 h-4" />
              New Member
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

        {/* Table */}
        <div className="rounded-2xl overflow-hidden" style={PANEL}>
          <div className="px-7 py-5" style={{ borderBottom: "1px solid rgba(237,230,214,0.06)" }}>
            <h2 className="text-sm font-semibold text-[#EDE6D6] flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: "#34E7C4" }} />
              Members ({users.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#34E7C4" }} />
            </div>
          ) : users.length === 0 ? (
            /* Empty state — unlit mesh node */
            <div className="flex flex-col items-center py-24 gap-4">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="8" stroke="#6E6678" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="24" cy="24" r="2" fill="#6E6678" fillOpacity="0.4" />
                <line x1="24" y1="4"  x2="24" y2="16" stroke="#6E6678" strokeOpacity="0.2" strokeWidth="0.75" />
                <line x1="24" y1="32" x2="24" y2="44" stroke="#6E6678" strokeOpacity="0.2" strokeWidth="0.75" />
                <line x1="4"  y1="24" x2="16" y2="24" stroke="#6E6678" strokeOpacity="0.2" strokeWidth="0.75" />
                <line x1="32" y1="24" x2="44" y2="24" stroke="#6E6678" strokeOpacity="0.2" strokeWidth="0.75" />
              </svg>
              <p className="text-sm text-[#6E6678]" style={{ fontFamily: "var(--font-mono), monospace" }}>no team yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(237,230,214,0.06)" }}>
                    {["User", "Email", "Role", "Status", "Joined", ""].map(h => (
                      <th key={h} className="px-6 py-4 text-[10px] uppercase tracking-widest font-semibold"
                        style={{ color: "#6E6678", fontFamily: "var(--font-mono), monospace" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <motion.tr key={u.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="group"
                      style={{ borderBottom: "1px solid rgba(237,230,214,0.04)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(237,230,214,0.02)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                            style={{ background: "rgba(52,231,196,0.12)", border: "1px solid rgba(52,231,196,0.2)", color: "#34E7C4" }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-sm text-[#EDE6D6]">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{ fontFamily: "var(--font-mono), monospace", color: "#A8A0B0", fontSize: "11px" }}>
                          {u.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider"
                          style={{ fontFamily: "var(--font-mono), monospace", background: "rgba(52,231,196,0.07)", border: "1px solid rgba(52,231,196,0.16)", color: "#34E7C4" }}>
                          {getRoleName(u.roleId)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] uppercase tracking-wider"
                          style={{
                            fontFamily: "var(--font-mono), monospace",
                            background: u.status === "active" ? "rgba(52,231,196,0.07)" : "rgba(242,162,76,0.07)",
                            border: u.status === "active" ? "1px solid rgba(52,231,196,0.16)" : "1px solid rgba(242,162,76,0.16)",
                            color: u.status === "active" ? "#34E7C4" : "#F2A24C",
                          }}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span style={{ fontFamily: "var(--font-mono), monospace", color: "#6E6678", fontSize: "10px" }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditUser(u); setEditRoleId(String(u.roleId || roles[0]?.id || "")); }}
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: "#A8A0B0" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#34E7C4"; e.currentTarget.style.background = "rgba(52,231,196,0.08)"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "#A8A0B0"; e.currentTarget.style.background = "transparent"; }}>
                            <Settings2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 rounded-lg transition-all"
                            style={{ color: "#A8A0B0" }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#FF6355"; e.currentTarget.style.background = "rgba(255,99,85,0.08)"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = "#A8A0B0"; e.currentTarget.style.background = "transparent"; }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(10,11,16,0.85)", backdropFilter: "blur(8px)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md rounded-2xl p-8 relative"
              style={{ background: "#14151F", border: "1px solid rgba(237,230,214,0.1)" }}>
              <div className="absolute top-0 left-8 right-8 h-px bg-[#EDE6D6]/10" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-light text-[#EDE6D6]" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                  New Member
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="text-[#6E6678] hover:text-[#EDE6D6] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                {[
                  { label: "Full Name",     key: "name",     type: "text",     placeholder: "Jane Smith" },
                  { label: "Email Address", key: "email",    type: "email",    placeholder: "jane@company.com" },
                  { label: "Password",      key: "password", type: "password", placeholder: "Min. 8 characters" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(237,230,214,0.7)" }}>{f.label}</label>
                    <input
                      type={f.type} required
                      value={(newUser as any)[f.key]}
                      onChange={e => setNewUser({ ...newUser, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                      style={INPUT_STYLE}
                      onFocus={e => { e.target.style.borderColor = "rgba(52,231,196,0.4)"; }}
                      onBlur={e => { e.target.style.borderColor = "rgba(237,230,214,0.08)"; }}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(237,230,214,0.7)" }}>Role</label>
                  <select
                    value={newUser.roleId}
                    onChange={e => setNewUser({ ...newUser, roleId: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                    style={{ ...INPUT_STYLE, appearance: "none" as any }}>
                    {roles.map(r => (
                      <option key={r.id} value={r.id} style={{ background: "#14151F" }}>
                        {r.name.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-all"
                    style={{ background: "#34E7C4", color: "#0A0B10" }}>
                    Create Member
                  </button>
                  <button type="button" onClick={() => setShowCreateModal(false)}
                    className="py-2.5 px-5 rounded-xl text-sm text-[#A8A0B0]"
                    style={{ background: "rgba(237,230,214,0.04)", border: "1px solid rgba(237,230,214,0.08)" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal */}
      <AnimatePresence>
        {editUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(10,11,16,0.85)", backdropFilter: "blur(8px)" }}
            onClick={e => { if (e.target === e.currentTarget) setEditUser(null); }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-sm rounded-2xl p-8 relative"
              style={{ background: "#14151F", border: "1px solid rgba(237,230,214,0.1)" }}>
              <div className="absolute top-0 left-8 right-8 h-px bg-[#EDE6D6]/10" />
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-light text-[#EDE6D6]" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                  Change Role
                </h2>
                <button onClick={() => setEditUser(null)} className="text-[#6E6678] hover:text-[#EDE6D6] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs mb-6" style={{ fontFamily: "var(--font-mono), monospace", color: "#34E7C4" }}>
                {editUser.name}
              </p>
              <form onSubmit={handleUpdateRole} className="space-y-4">
                <select
                  value={editRoleId}
                  onChange={e => setEditRoleId(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ ...INPUT_STYLE, appearance: "none" as any }}
                  onFocus={e => { e.target.style.borderColor = "rgba(52,231,196,0.4)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(237,230,214,0.08)"; }}>
                  {roles.map(r => (
                    <option key={r.id} value={r.id} style={{ background: "#14151F" }}>
                      {r.name.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <div className="flex gap-3 pt-1">
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-all"
                    style={{ background: "#34E7C4", color: "#0A0B10" }}>
                    Update Role
                  </button>
                  <button type="button" onClick={() => setEditUser(null)}
                    className="py-2.5 px-5 rounded-xl text-sm text-[#A8A0B0]"
                    style={{ background: "rgba(237,230,214,0.04)", border: "1px solid rgba(237,230,214,0.08)" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
