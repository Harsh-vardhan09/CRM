"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  ShieldCheck, Users, UserPlus, LogOut,
  LayoutDashboard, Bot, Mail, User, Briefcase, FileText, Settings, Building2, Menu, X
} from "lucide-react";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const isAdmin = user.role?.toLowerCase() === "admin" || user.role?.toLowerCase() === "super_admin";
  const isOwner = (user as any)?.isOwner;
  const isSuperAdmin = user.role?.toLowerCase() === "super_admin";

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const adminLinks: SidebarLink[] = [
    { href: "/admin", label: "Control Center", icon: ShieldCheck },
    { href: "/admin/roles", label: "Roles", icon: ShieldCheck },
    { href: "/admin/team", label: "Team", icon: Users },
    { href: "/admin/join-requests", label: "Requests", icon: UserPlus },
    ...(isOwner || isSuperAdmin ? [{ href: "/admin/company", label: "Company", icon: Building2 }] : []),
  ];

  const userLinks: SidebarLink[] = [
    { href: "/user", label: "Workspace", icon: User },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/automations", label: "Automations", icon: Bot },
    { href: "/support", label: "Support Inbox", icon: Mail },
    { href: "/clients", label: "Clients", icon: Briefcase },
    { href: "/leads", label: "Leads", icon: FileText },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const links = isAdmin ? adminLinks : userLinks;

  return (
    <div className="flex min-h-screen bg-ivory-50 text-ink-text selection:bg-brass/10">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-ink-950/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Ink 950 */}
      <aside className={`w-64 bg-ink-950 text-ivory-text border-r border-ink-border flex flex-col justify-between fixed h-screen z-40 transition-transform duration-200 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>
        <div>
          {/* Header & Wordmark */}
          <div className="p-8 border-b border-ink-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-brass" />
              <span className="font-serif text-lg tracking-tight text-ivory-text font-normal">VYOR</span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-widest text-muted-ink">v2</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {links.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors relative ${
                    active 
                      ? "text-ivory-text" 
                      : "text-muted-ink hover:text-ivory-text"
                  }`}
                >
                  {/* Brass Active Left Rule */}
                  {active && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] bg-brass" />
                  )}
                  <link.icon className={`w-4 h-4 ${active ? "text-brass" : "text-muted-ink"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Profile & Logout */}
        <div className="p-6 border-t border-ink-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-ink-800 border border-ink-border flex items-center justify-center text-sm font-semibold text-ivory-text font-serif">
              {user.name?.charAt(0) || "U"}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-ivory-text truncate">{user.name}</p>
              <p className="text-[10px] font-mono text-muted-ink uppercase tracking-wider truncate">
                {user.role?.replace("_", " ")}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium border border-ink-border text-muted-ink hover:text-brick hover:border-brick/30 hover:bg-brick/5 transition-all active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area - Ivory 50 */}
      <main className="flex-1 min-h-screen relative page-enter lg:pl-64">
        {/* Mobile Top Bar */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-white border-b border-ivory-border flex items-center px-6 gap-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 hover:bg-ivory-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-ink-text" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-brass" />
            <span className="font-serif text-sm tracking-tight text-ink-text font-semibold">VYOR</span>
          </div>
        </div>

        {/* Content with top padding on mobile for top bar */}
        <div className="lg:hidden pt-16" />
        <div className="p-8 md:p-12 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
