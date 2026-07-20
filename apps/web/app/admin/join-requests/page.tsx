"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, Loader2, UserPlus } from "lucide-react";
import DashboardLayout from "../../components/DashboardLayout";

interface JoinRequest { id: number; name: string; email: string; createdAt: string; }
interface Role { id: number; name: string; }

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function JoinRequestsPage() {
  const [requests, setRequests]     = useState<JoinRequest[]>([]);
  const [roles, setRoles]           = useState<Role[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  const [selectedUser, setSelectedUser]     = useState<JoinRequest | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const [isApproving, setIsApproving]       = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [reqsRes, rolesRes] = await Promise.all([
        fetch(`${API_URL}/auth/company/join-requests`, { credentials: "include" }),
        fetch(`${API_URL}/auth/company/roles`,         { credentials: "include" }),
      ]);
      if (!reqsRes.ok || !rolesRes.ok) throw new Error("Failed to fetch data. Ensure you are logged in as an Admin.");
      const reqsData  = await reqsRes.json();
      const rolesData = await rolesRes.json();
      setRequests(reqsData.data  || []);
      setRoles(rolesData.data    || []);
      if (rolesData.data?.length > 0) setSelectedRoleId(rolesData.data[0].id);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApprove = async () => {
    if (!selectedUser || !selectedRoleId) return;
    setIsApproving(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`${API_URL}/auth/company/join-requests/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: selectedUser.id, roleId: selectedRoleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve user.");
      setSuccess(`${selectedUser.name} approved`);
      setRequests(r => r.filter(x => x.id !== selectedUser.id));
      setSelectedUser(null);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) { setError(err.message); }
    finally { setIsApproving(false); }
  };

  const handleReject = async (userId: number, userName: string) => {
    if (!confirm(`Reject ${userName}'s request?`)) return;
    setError(""); setSuccess("");
    try {
      const res = await fetch(`${API_URL}/auth/company/join-requests/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject user.");
      setSuccess(`${userName} rejected`);
      setRequests(r => r.filter(x => x.id !== userId));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) { setError(err.message); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Header Section */}
        <div className="space-y-3 pb-8 border-b border-ivory-border">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
            <span className="w-1.5 h-1.5 rounded-full bg-brick" />
            Access Requests
          </div>
          <h1 className="text-3xl font-serif tracking-tight text-ink-text">
            Pending Join Requests
          </h1>
          <p className="text-sm text-muted-ivory">Review and approve or reject employee access requests.</p>
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

        {/* Content Card */}
        <div className="bg-white border border-ivory-border rounded-xl shadow-editorial overflow-hidden">
          <div className="px-6 py-5 border-b border-ivory-border">
            <h2 className="text-sm font-semibold text-ink-text flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brass" />
              Requests ({requests.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-brass" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center py-24 gap-4">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="8" stroke="#726C61" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="24" cy="24" r="2" fill="#726C61" fillOpacity="0.4" />
              </svg>
              <p className="text-xs font-mono uppercase tracking-wide text-muted-ivory">no pending requests</p>
            </div>
          ) : (
            <div className="divide-y divide-ivory-border">
              {requests.map((req, i) => (
                <motion.div 
                  key={req.id}
                  initial={{ opacity: 0, y: 8 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-5 gap-4 bg-white"
                >
                  <div className="pl-4 border-l-2 border-brick">
                    <p className="font-semibold text-sm text-ink-text">{req.name}</p>
                    <p className="font-mono text-xs text-muted-ivory mt-0.5">
                      {req.email}
                    </p>
                    <p className="font-mono text-[10px] text-muted-ink mt-0.5">
                      requested · {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions — Muted, Editorial, conforming to button system */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={() => setSelectedUser(req)}
                      className="rounded-lg border border-ivory-border bg-white px-4 py-2 text-xs font-medium text-ink-text transition-colors hover:bg-ivory-100 active:scale-[0.98]"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleReject(req.id, req.name)}
                      className="rounded-lg border border-brick/30 bg-white px-4 py-2 text-xs font-medium text-brick transition-colors hover:bg-brick/5 active:scale-[0.98]"
                    >
                      Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal - Ink 900 */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70"
            onClick={e => { if (e.target === e.currentTarget) setSelectedUser(null); }}
          >
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="w-full max-w-sm bg-ink-900 border border-ink-border rounded-2xl p-8 text-ivory-text shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)] relative"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-serif text-ivory-text">
                  Approve Access
                </h2>
                <button onClick={() => setSelectedUser(null)} className="text-muted-ink hover:text-ivory-text transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="font-mono text-xs text-brass mb-6">
                {selectedUser.name}
              </p>

              <div className="mb-6">
                <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">
                  Assign Role
                </label>
                <select
                  value={selectedRoleId}
                  onChange={e => setSelectedRoleId(Number(e.target.value))}
                  className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id} style={{ background: "#1B1B21" }}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleApprove} 
                  disabled={isApproving}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brass hover:bg-brass-hover text-white transition-colors active:scale-[0.98] disabled:opacity-60"
                >
                  {isApproving ? "Approving…" : "Confirm Approval"}
                </button>
                <button 
                  onClick={() => setSelectedUser(null)} 
                  disabled={isApproving}
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
