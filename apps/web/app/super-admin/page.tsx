"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Plus, 
  X, 
  Settings2, 
  CheckCircle2, 
  ChevronLeft, 
  ShieldAlert,
  Loader2
} from "lucide-react";

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
      <div className="flex items-center justify-center min-h-screen bg-[#030712]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <Loader2 className="w-10 h-10 text-indigo-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none mix-blend-screen" />

      <div className="max-w-7xl mx-auto p-6 md:p-12 relative z-10 space-y-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between backdrop-blur-2xl bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-br from-white via-indigo-200 to-indigo-500 bg-clip-text text-transparent tracking-tight">
              Platform Management
            </h1>
            <p className="text-indigo-200/60 mt-2 font-medium">Super-Admin access to all registered tenants</p>
          </div>
          <div className="mt-6 md:mt-0 flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/admin')}
              className="flex items-center px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center px-5 py-2.5 rounded-xl bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] text-sm font-bold transition-colors hover:bg-indigo-400"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Company
            </motion.button>
          </div>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center">
              <ShieldAlert className="w-5 h-5 mr-3" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-3" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Data Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-2xl bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="p-6 md:p-8 border-b border-white/5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="text-indigo-400 w-5 h-5" />
              Registered Companies
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              </div>
            ) : companies.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                No companies found. Create one to get started.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-slate-400 text-sm uppercase tracking-wider">
                    <th className="p-4 font-semibold">ID</th>
                    <th className="p-4 font-semibold">Company Name</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Joined</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c, i) => (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={c.id} 
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="p-4 font-mono text-xs text-slate-500">#{c.id}</td>
                      <td className="p-4 font-bold text-slate-200">{c.name}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setEditCompany(c);
                            setSelectedFeatures([]); // In reality, fetch company features first
                          }}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm font-medium hover:bg-indigo-500 hover:text-white transition-colors"
                        >
                          <Settings2 className="w-4 h-4 mr-1.5" />
                          Features
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Create Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                onClick={() => setShowCreateModal(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md backdrop-blur-2xl bg-[#0a0a0a]/80 border border-white/10 rounded-3xl shadow-2xl p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-white">New Company</h3>
                  <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleCreateCompany} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Company Name</label>
                    <input
                      type="text"
                      required
                      value={newCompanyName}
                      onChange={(e) => setNewCompanyName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="Acme Corp..."
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5 transition-colors font-medium">Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="px-6 py-2 rounded-xl bg-indigo-500 text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)]">Create</motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Feature Assignment Modal */}
        <AnimatePresence>
          {editCompany && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                onClick={() => setEditCompany(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg backdrop-blur-2xl bg-[#0a0a0a]/80 border border-white/10 rounded-3xl shadow-2xl p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">Tenant Features</h3>
                    <p className="text-sm text-indigo-400">{editCompany.name}</p>
                  </div>
                  <button onClick={() => setEditCompany(null)} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleUpdateFeatures} className="space-y-4">
                  <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                    {AVAILABLE_FEATURES.map((feat) => {
                      const isSelected = selectedFeatures.includes(feat.id);
                      return (
                        <label key={feat.id} className="flex items-center space-x-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500 group-hover:border-slate-400'}`}>
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
                          <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>{feat.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={() => setEditCompany(null)} className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5 transition-colors font-medium">Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="px-6 py-2 rounded-xl bg-indigo-500 text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)]">Apply Features</motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
