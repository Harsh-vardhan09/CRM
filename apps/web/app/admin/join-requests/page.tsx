"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, CheckCircle2, X, Loader2, UserPlus } from "lucide-react";

interface JoinRequest { id: number; name: string; email: string; createdAt: string; }
interface Role { id: number; name: string; }

const PANEL = {
  background: "rgba(237,230,214,0.025)",
  border: "1px solid rgba(237,230,214,0.08)",
};
const INPUT_STYLE = {
  background: "rgba(10,11,16,0.6)",
  border: "1px solid rgba(237,230,214,0.08)",
  color: "#EDE6D6",
};
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
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "linear-gradient(to bottom right, #14151F, #0A0B10, #211A34)" }}>

      {/* Grain */}
      <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />

      <div className="max-w-3xl mx-auto p-6 md:p-12 relative z-10">

        {/* Header */}
        <div className="mb-10">
          <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-[#6E6678] hover:text-[#34E7C4] transition-colors mb-6"
            style={{ fontFamily: "var(--font-mono), monospace" }}>
            <ChevronLeft className="w-3.5 h-3.5" /> back to control center
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md mb-3"
            style={{ background: "rgba(255,99,85,0.07)", border: "1px solid rgba(255,99,85,0.18)", color: "#FF6355", fontFamily: "var(--font-mono), monospace" }}>
            <UserPlus className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-widest">Access Requests</span>
          </div>
          <h1 className="text-3xl font-light text-[#EDE6D6] tracking-tight"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
            Pending Join Requests
          </h1>
          <p className="text-sm text-[#6E6678] mt-1.5">Review and approve or reject employee access requests.</p>
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

        {/* Content */}
        <div className="rounded-2xl overflow-hidden" style={PANEL}>
          <div className="px-7 py-5" style={{ borderBottom: "1px solid rgba(237,230,214,0.06)" }}>
            <h2 className="text-sm font-semibold text-[#EDE6D6]">
              Requests ({requests.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#34E7C4" }} />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center py-24 gap-4">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <circle cx="24" cy="24" r="8" stroke="#6E6678" strokeWidth="1" strokeDasharray="4 4" />
                <circle cx="24" cy="24" r="2" fill="#6E6678" fillOpacity="0.4" />
              </svg>
              <p className="text-sm text-[#6E6678]" style={{ fontFamily: "var(--font-mono), monospace" }}>no pending requests</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "rgba(237,230,214,0.05)" }}>
              {requests.map((req, i) => (
                <motion.div key={req.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-7 py-5 gap-4"
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(237,230,214,0.015)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>

                  {/* Annotated border-left */}
                  <div className="pl-4 border-l relative" style={{ borderColor: "rgba(255,99,85,0.3)" }}>
                    <span className="absolute -left-[3px] top-1 w-1.5 h-1.5 rounded-full" style={{ background: "#FF6355" }} />
                    <p className="font-semibold text-sm text-[#EDE6D6]">{req.name}</p>
                    <p style={{ fontFamily: "var(--font-mono), monospace", color: "#A8A0B0", fontSize: "11px" }}>
                      {req.email}
                    </p>
                    <p style={{ fontFamily: "var(--font-mono), monospace", color: "#6E6678", fontSize: "10px" }} className="mt-0.5">
                      requested · {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions — Teal / Coral, not green / red */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => setSelectedUser(req)}
                      className="px-4 py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
                      style={{ background: "rgba(52,231,196,0.1)", border: "1px solid rgba(52,231,196,0.22)", color: "#34E7C4" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(52,231,196,0.18)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(52,231,196,0.1)"}>
                      Approve
                    </button>
                    <button onClick={() => handleReject(req.id, req.name)}
                      className="px-4 py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all"
                      style={{ background: "rgba(255,99,85,0.07)", border: "1px solid rgba(255,99,85,0.2)", color: "#FF6355" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,99,85,0.15)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,99,85,0.07)"}>
                      Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(10,11,16,0.85)", backdropFilter: "blur(8px)" }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedUser(null); }}>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-sm rounded-2xl p-8 relative"
              style={{ background: "#14151F", border: "1px solid rgba(237,230,214,0.1)" }}>
              <div className="absolute top-0 left-8 right-8 h-px bg-[#EDE6D6]/10" />
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-light text-[#EDE6D6]"
                  style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                  Approve Access
                </h2>
                <button onClick={() => setSelectedUser(null)} className="text-[#6E6678] hover:text-[#EDE6D6] transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs mb-6" style={{ fontFamily: "var(--font-mono), monospace", color: "#34E7C4" }}>
                {selectedUser.name}
              </p>

              <div className="mb-6">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "rgba(237,230,214,0.7)" }}>
                  Assign Role
                </label>
                <select
                  value={selectedRoleId}
                  onChange={e => setSelectedRoleId(Number(e.target.value))}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{ ...INPUT_STYLE, appearance: "none" as any }}
                  onFocus={e => { e.target.style.borderColor = "rgba(52,231,196,0.4)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(237,230,214,0.08)"; }}>
                  {roles.map(r => (
                    <option key={r.id} value={r.id} style={{ background: "#14151F" }}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button onClick={handleApprove} disabled={isApproving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] disabled:opacity-60 transition-all"
                  style={{ background: "#34E7C4", color: "#0A0B10" }}>
                  {isApproving ? "Approving…" : "Confirm Approval"}
                </button>
                <button onClick={() => setSelectedUser(null)} disabled={isApproving}
                  className="py-2.5 px-5 rounded-xl text-sm text-[#A8A0B0] transition-all"
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
