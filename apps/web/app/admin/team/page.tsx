"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, X, Settings2, CheckCircle2, Loader2, Trash2, Mail } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";

interface User {
  id: number;
  name: string;
  email: string;
  roleId: number | null;
  status: string;
  createdAt: string;
}
interface Role { id: number; name: string; }

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteConfirm = async () => {
    if (!deleteUser) return;
    setIsDeleting(true);
    setError(""); setSuccess("");
    try {
      const res = await fetch(`${API_URL}/admin/users/${deleteUser.id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Failed to delete user");
      setSuccess(`${deleteUser.name} removed`);
      setDeleteUser(null);
      fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setIsDeleting(false); }
  };

  const getRoleName = (roleId: number | null) => {
    if (!roleId) return "No Role";
    return roles.find(r => r.id === roleId)?.name.replace(/_/g, " ") || "Unknown";
  };

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
              <span className="w-1.5 h-1.5 rounded-full bg-moss animate-pulse" />
              Team Management
            </div>
            <h1 className="text-3xl font-serif tracking-tight text-ink-text">
              Organisation Members
            </h1>
            <p className="text-sm text-muted-ivory">Manage users, roles, and active sessions.</p>
          </div>
          
          {/* New Member CTA (Brass Accent) */}
          <button 
            onClick={() => { setShowCreateModal(true); setError(""); }}
            className="inline-flex items-center gap-2 rounded-lg bg-brass px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brass-hover active:scale-[0.98] self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            New Member
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

        {/* Members Table */}
        <div className="bg-white border border-ivory-border rounded-xl shadow-editorial overflow-hidden">
          <div className="px-6 py-5 border-b border-ivory-border">
            <h2 className="text-sm font-semibold text-ink-text flex items-center gap-2">
              <Users className="w-4 h-4 text-brass" />
              Members ({users.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-brass" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center py-24 gap-4">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="8" stroke="#726C61" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="24" cy="24" r="2" fill="#726C61" fillOpacity="0.4" />
              </svg>
              <p className="text-xs font-mono uppercase tracking-wide text-muted-ivory">no team yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-ivory-border bg-ivory-50">
                    {["User", "Email", "Role", "Status", "Joined", ""].map(h => (
                      <th key={h} className="px-6 py-3.5 text-xs font-mono uppercase tracking-wider font-semibold text-muted-ivory">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-border">
                  {users.map((u, i) => (
                    <tr 
                      key={u.id}
                      className={`hover:bg-ivory-50/50 transition-colors ${
                        i % 2 === 1 ? "bg-ivory-100/30" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-ivory-100 border border-ivory-border flex items-center justify-center text-sm font-semibold text-ink-text font-serif">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-sm text-ink-text">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-muted-ivory">
                          {u.email}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
                          <span className="w-1.5 h-1.5 rounded-full bg-brass" />
                          {getRoleName(u.roleId)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-moss" : "bg-ochre"}`} />
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-muted-ivory">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Ghost button for settings */}
                          <button 
                            onClick={() => { setEditUser(u); setEditRoleId(String(u.roleId || roles[0]?.id || "")); }}
                            className="p-1.5 rounded-lg border border-ivory-border bg-white text-muted-ivory hover:text-ink-text hover:bg-ivory-100 transition-colors"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                          {/* Ghost button for delete */}
                          <button 
                            onClick={() => setDeleteUser(u)}
                            className="p-1.5 rounded-lg border border-brick/20 bg-white text-brick hover:bg-brick/5 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal - Ink 900 */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70"
            onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-md bg-ink-900 border border-ink-border rounded-2xl p-8 text-ivory-text shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)] relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-serif text-ivory-text">
                  New Member
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="text-muted-ink hover:text-ivory-text transition-colors">
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
                    <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">{f.label}</label>
                    <input
                      type={f.type} required
                      value={(newUser as any)[f.key]}
                      onChange={e => setNewUser({ ...newUser, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Role</label>
                  <select
                    value={newUser.roleId}
                    onChange={e => setNewUser({ ...newUser, roleId: e.target.value })}
                    className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id} style={{ background: "#1B1B21" }}>
                        {r.name.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brass hover:bg-brass-hover text-white transition-colors active:scale-[0.98]"
                  >
                    Create Member
                  </button>
                  <button type="button" onClick={() => setShowCreateModal(false)}
                    className="py-2.5 px-5 rounded-lg text-sm font-medium border border-ink-border text-ivory-text hover:bg-ink-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Role Modal - Ink 900 */}
      <AnimatePresence>
        {editUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70"
            onClick={e => { if (e.target === e.currentTarget) setEditUser(null); }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-sm bg-ink-900 border border-ink-border rounded-2xl p-8 text-ivory-text shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)] relative"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-serif text-ivory-text">
                  Change Role
                </h2>
                <button onClick={() => setEditUser(null)} className="text-muted-ink hover:text-ivory-text transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="font-mono text-xs text-brass mb-6">
                {editUser.name}
              </p>
              <form onSubmit={handleUpdateRole} className="space-y-4">
                <select
                  value={editRoleId}
                  onChange={e => setEditRoleId(e.target.value)}
                  className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id} style={{ background: "#1B1B21" }}>
                      {r.name.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <div className="flex gap-3 pt-4">
                  <button type="submit"
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brass hover:bg-brass-hover text-white transition-colors active:scale-[0.98]"
                  >
                    Update Role
                  </button>
                  <button type="button" onClick={() => setEditUser(null)}
                    className="py-2.5 px-5 rounded-lg text-sm font-medium border border-ink-border text-ivory-text hover:bg-ink-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal - Ink 900 with Brick Destructive Button */}
      <AnimatePresence>
        {deleteUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70"
            onClick={e => { if (e.target === e.currentTarget) setDeleteUser(null); }}
          >
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-sm bg-ink-900 border border-ink-border rounded-2xl p-8 text-ivory-text shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)] relative"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-serif text-ivory-text text-brick">
                  Remove Member
                </h2>
                <button onClick={() => setDeleteUser(null)} className="text-muted-ink hover:text-ivory-text transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-muted-ink mb-6">
                Are you sure you want to remove <span className="text-ivory-text font-semibold">{deleteUser.name}</span> from the organisation? This action is irreversible.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={handleDeleteConfirm} 
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brick hover:bg-brick/80 text-white transition-colors active:scale-[0.98] disabled:opacity-60"
                >
                  {isDeleting ? "Removing…" : "Remove Member"}
                </button>
                <button 
                  onClick={() => setDeleteUser(null)} 
                  disabled={isDeleting}
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
