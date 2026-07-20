"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { CheckCircle2, XCircle, Mail, Building2, Clock } from "lucide-react";

const MODULES = [
  { href: "/dashboard",   label: "Dashboard",    desc: "Analytics overview: lead pipeline, channel attribution, and message activity." },
  { href: "/automations", label: "Automations",  desc: "Auto-message inactive leads via configurable trigger rules." },
  { href: "/support",     label: "Support Inbox",desc: "View and reply to customer tickets across all channels." },
  { href: "/clients",     label: "Clients",      desc: "Manage client accounts, contacts, and account relationships." },
  { href: "/leads",       label: "Leads",        desc: "Track prospects, manage engagement pipelines, and send cross-channel messages." },
];

export default function UserPage() {
  const { user, loading } = useAuth();
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
      <div className="flex items-center justify-center min-h-screen bg-ivory-50 text-ink-text">
        <svg width="80" height="24" viewBox="0 0 80 24" fill="none">
          <path
            d="M4 12 L76 12"
            stroke="#9C7A3C" strokeWidth="2" strokeLinecap="round"
            className="animate-pulse"
          />
        </svg>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-10">
        
        {/* Header Title Section */}
        <div className="space-y-3 pb-8 border-b border-ivory-border">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
            <span className="w-1.5 h-1.5 rounded-full bg-moss" />
            Sales Representative Workspace
          </div>
          <h1 className="text-4xl font-serif tracking-tight text-ink-text">
            Workspace
          </h1>
          <p className="text-muted-ivory text-sm">Manage leads, opportunities, and track communication pipelines.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Profile Card */}
          <div className="bg-white border border-ivory-border rounded-xl p-6 shadow-editorial">
            <h3 className="text-xs font-mono uppercase tracking-wide text-muted-ivory mb-6">Profile Details</h3>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-ivory-100 border border-ivory-border flex items-center justify-center text-lg font-serif text-ink-text">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-ink-text font-semibold text-base">{user.name}</p>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wide text-muted-ivory mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brass" /> {user.role}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-ivory-border">
              {[
                { label: "Email", value: user.email, icon: Mail },
                { label: "Org ID", value: user.orgId || "None", icon: Building2 },
                { label: "Last Session", value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "First Login", icon: Clock },
              ].map(row => (
                <div key={row.label} className="flex items-start justify-between py-1">
                  <div className="flex items-center gap-2">
                    <row.icon className="w-3.5 h-3.5 text-muted-ivory shrink-0" />
                    <span className="text-xs text-muted-ivory font-mono uppercase tracking-wide">{row.label}</span>
                  </div>
                  <span className="font-mono text-xs text-ink-text text-right max-w-[55%] truncate">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Permissions Card */}
          <div className="md:col-span-2 bg-white border border-ivory-border rounded-xl p-6 shadow-editorial">
            <h3 className="text-xs font-mono uppercase tracking-wide text-muted-ivory mb-6">Role Permissions & System Capabilities</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {Object.entries(user.permissions).map(([key, val]) => (
                <div key={key} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  val 
                    ? "bg-white border-ivory-border" 
                    : "bg-ivory-100 border-transparent opacity-60"
                }`}>
                  <div className="h-7 w-7 shrink-0 rounded flex items-center justify-center">
                    {val ? (
                      <span className="w-2 h-2 rounded-full bg-moss" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-muted-ivory" />
                    )}
                  </div>
                  <div>
                    <p className={`text-xs font-semibold capitalize ${val ? "text-ink-text" : "text-muted-ivory"}`}>
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="font-mono text-[9px] text-muted-ivory mt-0.5">
                      {val ? "Granted to Sales Rep" : "requires upgrade"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Upgrade note */}
            <div className="pl-4 border-l border-brass/30 relative">
              <span className="absolute -left-[3.5px] top-1.5 w-1.5 h-1.5 rounded-full bg-brass" />
              <p className="text-xs font-semibold text-ink-text mb-1">Sales Representative Note</p>
              <p className="text-xs leading-relaxed text-muted-ivory">
                You have access to view and edit leads scoped to your organisation. To perform deletion, export files, build automations, or invite team members, please contact an administrator to upgrade your access role.
              </p>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="pt-8 border-t border-ivory-border">
          <h2 className="text-xs font-mono uppercase tracking-wide text-muted-ivory mb-5">
            Modules & Applications
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {MODULES.map(mod => (
              <Link key={mod.href} href={mod.href} className="block group">
                <div className="bg-white border border-ivory-border rounded-xl p-6 shadow-editorial transition-colors hover:border-brass/30 active:scale-[0.98]">
                  <div className="h-9 w-9 rounded-lg bg-ivory-100 border border-ivory-border flex items-center justify-center mb-4 text-ink-text group-hover:text-brass transition-colors">
                    <span className="w-3.5 h-3.5 rounded-full bg-ink-text group-hover:bg-brass transition-colors" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink-text mb-1 group-hover:text-brass transition-colors">{mod.label}</h3>
                  <p className="text-xs text-muted-ivory leading-relaxed">{mod.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
