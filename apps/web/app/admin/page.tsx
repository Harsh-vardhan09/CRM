"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import {
  ShieldCheck, Users, UserPlus, Building2, Mail, Fingerprint, Clock, CheckCircle2, XCircle
} from "lucide-react";

export default function AdminPage() {
  const { user, loading } = useAuth();
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

  const moduleCards = [
    ...(user.isSuperAdmin ? [{
      href: "/super-admin",
      label: "Platform",
      desc: "Manage global tenants and company features",
      icon: Building2,
      activeState: true,
    }] : []),
    { href: "/admin/roles",        label: "Roles",    desc: "Configure granular access and permissions", icon: ShieldCheck, activeState: true },
    { href: "/admin/team",         label: "Team",     desc: "Manage active users in your organisation",  icon: Users,       activeState: true },
    { href: "/admin/join-requests",label: "Requests", desc: "Review pending employee access requests",   icon: UserPlus,    activeState: false },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10">
        {/* Header Title Section */}
        <div className="space-y-3 pb-8 border-b border-ivory-border">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
            <span className="w-1.5 h-1.5 rounded-full bg-moss animate-pulse" />
            {user.isSuperAdmin ? "Super Admin" : "Company Admin"}
          </div>

          <h1 className="text-4xl font-serif tracking-tight text-ink-text">
            Control Center
          </h1>
          <p className="text-muted-ivory text-sm max-w-lg">
            Manage organisation settings, security roles, and user pipelines with administrative access.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Identity Card */}
          <div className="lg:col-span-4 bg-white border border-ivory-border rounded-xl p-6 shadow-editorial">
            <h3 className="text-xs font-mono uppercase tracking-wide text-muted-ivory flex items-center gap-2 mb-6">
              <Fingerprint className="w-3.5 h-3.5 text-brass" />
              Identity
            </h3>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-ivory-100 border border-ivory-border flex items-center justify-center text-lg font-serif text-ink-text">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-ink-text font-semibold text-base">{user.name}</p>
                <p className="font-mono text-xs text-brass uppercase tracking-wider mt-0.5">
                  {user.role?.replace("_", " ")}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-ivory-border">
              {[
                { label: "Email", value: user.email, icon: Mail },
                { label: "Org ID", value: user.orgId || "N/A", icon: Building2 },
                { label: "Last Login", value: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "New Session", icon: Clock },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <row.icon className="w-3.5 h-3.5 text-muted-ivory" />
                    <span className="text-xs text-muted-ivory font-mono uppercase tracking-wide">{row.label}</span>
                  </div>
                  <span className="font-mono text-xs text-ink-text tracking-tight">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Capabilities */}
          <div className="lg:col-span-8 bg-white border border-ivory-border rounded-xl p-6 shadow-editorial">
            <h3 className="text-xs font-mono uppercase tracking-wide text-muted-ivory flex items-center gap-2 mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-brass" />
              System Capabilities
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(user.permissions).map(([key, val]) => (
                <div
                  key={key}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    val 
                      ? "bg-white border-ivory-border" 
                      : "bg-ivory-100 border-transparent opacity-60"
                  }`}
                >
                  <div className={`h-8 w-8 rounded flex items-center justify-center ${
                    val ? "text-moss bg-ivory-100 border border-ivory-border" : "text-muted-ivory"
                  }`}>
                    {val ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-text capitalize">{key.replace(/_/g, " ")}</p>
                    <p className="font-mono text-[10px] text-muted-ivory">
                      {val ? `Level · ${val}` : "restricted"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modules Row */}
          <div className="lg:col-span-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {moduleCards.map(card => (
                <Link key={card.href} href={card.href} className="block group">
                  <div className="bg-white border border-ivory-border rounded-xl p-6 shadow-editorial transition-colors hover:border-brass/30 active:scale-[0.98]">
                    <div className="h-10 w-10 rounded-lg bg-ivory-100 border border-ivory-border flex items-center justify-center mb-4 text-ink-text group-hover:text-brass transition-colors">
                      <card.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-semibold text-ink-text mb-1 group-hover:text-brass transition-colors">{card.label}</h3>
                    <p className="text-xs text-muted-ivory leading-relaxed">{card.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
