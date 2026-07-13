"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface UserPermissions {
  can_view_leads: boolean;
  can_edit_leads: boolean;
  can_delete_leads: boolean;
  can_export_data: boolean;
  can_run_automations: boolean;
  can_invite_users: boolean;
}

export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  role: "super_admin" | "admin" | "sales_rep";
  permissions: UserPermissions;
  orgId?: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Important to send httpOnly cookies
      });

      if (
        res.ok &&
        res.headers.get("content-type")?.includes("application/json")
      ) {
        const data = await res.json();
        setUser(data.user);
      } else if (res.status === 401) {
        // Expected response when user is not logged in
        setUser(null);
      } else {
        const txt = await res.text();
        console.error(
          "Unexpected response from /auth/me:",
          res.status,
          txt.slice(0, 200),
        );
        setUser(null);
      }
    } catch (err) {
      console.error("Failed to check auth:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Save cookies in browser
      });

      // Ensure JSON response before parsing
      if (res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        if (res.ok && data.status === "success") {
          setUser(data.user);
          // Redirect based on role
          if (data.user.role === "admin" || data.user.role === "super_admin") {
            router.push("/admin");
          } else {
            router.push("/user");
          }
          return { success: true };
        }
        return { success: false, error: data.message || "Login failed." };
      } else {
        const txt = await res.text();
        console.error(
          "Unexpected response from /auth/login:",
          res.status,
          txt.slice(0, 200),
        );
        return { success: false, error: "Invalid server response." };
      }
    } catch (err) {
      console.error("Login request failed:", err);
      return {
        success: false,
        error: "Network error. Make sure server is running.",
      };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Failed to contact logout API:", err);
    } finally {
      setUser(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
