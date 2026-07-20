"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, X, Settings2, CheckCircle2, ShieldAlert, Loader2 } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";

interface Company {
  id: number;
  name: string;
  status: string;
  createdAt: string;
}

export default function SuperAdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  const AVAILABLE_FEATURES = [
    { id: "leads_management", label: "Leads Management" },
    { id: "analytics", label: "Analytics & Reporting" },
    { id: "automations", label: "Workflow Automations" },
    { id: "settings", label: "Advanced Settings" }
  ];

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!user.isSuperAdmin) {
        router.push("/admin");
      } else {
        fetchCompanies();
      }
    }
  }, [user, loading, router]);

  const fetchCompanies = async () => {
    setIsLoading(true);
    setError("");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/admin/companies`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch companies");
      const data = await res.json();
      setCompanies(data.data || []);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setError("");
    setSuccess("");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/admin/companies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newCompanyName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Failed to create company");
      
      setSuccess("Company created successfully!");
      setShowCreateModal(false);
      setNewCompanyName("");
      fetchCompanies();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateFeatures = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCompany) return;
    setError("");
    setSuccess("");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/admin/companies/${editCompany.id}/features`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ features: selectedFeatures }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || "Failed to update features");
      
      setSuccess(`Features updated for ${editCompany.name}!`);
      setEditCompany(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading || !user || !user.isSuperAdmin) {
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-8 border-b border-ivory-border gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
              <span className="w-1.5 h-1.5 rounded-full bg-brass" />
              Platform Management
            </div>
            <h1 className="text-3xl font-serif tracking-tight text-ink-text">
              Platform Tenants
            </h1>
            <p className="text-sm text-muted-ivory">Super-Admin access to all registered tenants</p>
          </div>
          
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brass px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brass-hover active:scale-[0.98] self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Company
          </button>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-lg text-sm flex items-center gap-3 border border-brick/20 bg-brick/5 text-brick">
              <ShieldAlert className="w-5 h-5" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-lg text-sm flex items-center gap-3 border border-moss/20 bg-moss/5 text-moss">
              <CheckCircle2 className="w-5 h-5" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Registered Companies Card */}
        <div className="bg-white border border-ivory-border rounded-xl shadow-editorial overflow-hidden">
          <div className="px-6 py-5 border-b border-ivory-border">
            <h2 className="text-sm font-semibold text-ink-text flex items-center gap-2">
              <Building2 className="text-brass w-4 h-4" />
              Registered Companies
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-brass animate-spin" />
              </div>
            ) : companies.length === 0 ? (
              <div className="p-12 text-center text-muted-ivory">
                No companies found. Create one to get started.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-ivory-50 text-muted-ivory text-xs font-mono uppercase tracking-wider border-b border-ivory-border">
                    <th className="px-6 py-3.5 font-semibold">ID</th>
                    <th className="px-6 py-3.5 font-semibold">Company Name</th>
                    <th className="px-6 py-3.5 font-semibold">Status</th>
                    <th className="px-6 py-3.5 font-semibold">Joined</th>
                    <th className="px-6 py-3.5 font-semibold text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-border">
                  {companies.map((c, i) => (
                    <tr 
                      key={c.id} 
                      className={`hover:bg-ivory-50/50 transition-colors ${
                        i % 2 === 1 ? "bg-ivory-100/30" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-mono text-xs text-muted-ivory">#{c.id}</td>
                      <td className="px-6 py-4 font-bold text-ink-text">{c.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
                          <span className="w-1.5 h-1.5 rounded-full bg-moss" />
                          {c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-ivory font-mono">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setEditCompany(c);
                            setSelectedFeatures([]);
                          }}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-ivory-border bg-white text-xs font-medium text-ink-text transition-colors hover:bg-ivory-100 active:scale-[0.98]"
                        >
                          <Settings2 className="w-4 h-4 mr-1.5 text-muted-ivory" />
                          Features
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create Modal - Ink 900 */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70" 
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="relative w-full max-w-md bg-ink-900 border border-ink-border rounded-2xl p-8 shadow-2xl text-ivory-text"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-serif text-ivory-text">New Company</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-muted-ink hover:text-ivory-text transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateCompany} className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wide text-muted-ink mb-1.5">Company Name</label>
                    <input
                      type="text"
                      required
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      className="w-full rounded-lg border border-ink-border bg-ink-800 px-4 py-3 text-sm text-ivory-text placeholder-muted-ink outline-none transition-colors focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                      placeholder="Acme Corp..."
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brass hover:bg-brass-hover text-white transition-colors active:scale-[0.98]">Create</button>
                    <button type="button" onClick={() => setShowCreateModal(false)} className="py-2.5 px-5 rounded-lg text-sm font-medium border border-ink-border text-ivory-text hover:bg-ink-800 transition-colors">Cancel</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feature Assignment Modal - Ink 900 */}
        <AnimatePresence>
          {editCompany && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70" 
              onClick={() => setEditCompany(null)}
            >
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="relative w-full max-w-lg bg-ink-900 border border-ink-border rounded-2xl p-8 shadow-2xl text-ivory-text"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-serif text-ivory-text">Tenant Features</h3>
                    <p className="font-mono text-xs text-brass mt-0.5">{editCompany.name}</p>
                  </div>
                  <button onClick={() => setEditCompany(null)} className="text-muted-ink hover:text-ivory-text transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleUpdateFeatures} className="space-y-6">
                  <div className="space-y-3 bg-ink-800 p-4 rounded-xl border border-ink-border">
                    {AVAILABLE_FEATURES.map((feat) => {
                      const isSelected = selectedFeatures.includes(feat.id);
                      return (
                        <label key={feat.id} className="flex items-center space-x-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                            isSelected ? 'bg-brass border-brass' : 'border-muted-ink group-hover:border-ivory-text'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedFeatures([...selectedFeatures, feat.id]);
                              else setSelectedFeatures(selectedFeatures.filter(f => f !== feat.id));
                            }} 
                          />
                          <span className={`text-sm font-medium ${isSelected ? 'text-ivory-text' : 'text-muted-ink group-hover:text-ivory-text'}`}>{feat.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="submit" className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-brass hover:bg-brass-hover text-white transition-colors active:scale-[0.98]">Apply Features</button>
                    <button type="button" onClick={() => setEditCompany(null)} className="py-2.5 px-5 rounded-lg text-sm font-medium border border-ink-border text-ivory-text hover:bg-ink-800 transition-colors">Cancel</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
