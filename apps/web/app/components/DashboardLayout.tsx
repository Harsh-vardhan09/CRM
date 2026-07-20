"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { 
  ShieldCheck, Users, UserPlus, LogOut, 
  LayoutDashboard, Bot, Mail, User, Briefcase, FileText, Settings
} from "lucide-react";

interface SidebarLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return <>{children}</>;

  const isAdmin = user.role?.toLowerCase() === "admin" || user.role?.toLowerCase() === "super_admin";

  const adminLinks: SidebarLink[] = [
    { href: "/admin", label: "Control Center", icon: ShieldCheck },
    { href: "/admin/roles", label: "Roles", icon: ShieldCheck },
    { href: "/admin/team", label: "Team", icon: Users },
    { href: "/admin/join-requests", label: "Requests", icon: UserPlus },
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
      {/* Sidebar - Ink 950 */}
      <aside className="w-64 bg-ink-950 text-ivory-text border-r border-ink-border flex flex-col justify-between fixed h-screen z-20">
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
      <main className="flex-1 pl-64 min-h-screen relative page-enter">
        <div className="p-8 md:p-12 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
