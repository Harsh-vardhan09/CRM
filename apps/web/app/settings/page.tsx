"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { User, ShieldAlert, CheckCircle2, Lock } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function SettingsPage() {
  const { user, checkAuth } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: user?.name || "", avatar: user?.avatar || "" });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    if (!profileForm.name.trim()) { setProfileError("Name is required."); return; }
    setProfileSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: profileForm.name, avatar: profileForm.avatar || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile.");
      setProfileSuccess("Profile updated successfully.");
      await checkAuth();
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    setPasswordSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auth/me/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update password.");
      setPasswordSuccess("Password updated successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setPasswordError(err.message);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-2xl mx-auto">
        
        {/* Header Section */}
        <div className="space-y-3 pb-8 border-b border-ivory-border">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-ivory-border bg-ivory-100 px-2.5 py-1 text-xs font-mono uppercase tracking-wide text-muted-ivory">
            <User className="w-3.5 h-3.5" />
            Account settings
          </div>
          <h1 className="text-3xl font-serif tracking-tight text-ink-text">
            Settings
          </h1>
          <p className="text-sm text-muted-ivory">Update your profile and security settings.</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-ivory-border rounded-xl p-8 shadow-editorial">
          <h3 className="text-xs font-mono uppercase tracking-wide text-muted-ivory border-b border-ivory-border pb-3 mb-6 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-brass" />
            Profile Information
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {profileError && (
              <div className="rounded-lg border border-brick/20 bg-brick/5 p-3 text-sm text-brick flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="rounded-lg border border-moss/20 bg-moss/5 p-3 text-sm text-moss flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {profileSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wide text-muted-ivory mb-1.5">Display Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
                className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-muted-ivory mb-1.5">Avatar URL</label>
              <input
                type="url"
                value={profileForm.avatar}
                onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                placeholder="https://example.com/avatar.png"
              />
              <p className="mt-1.5 text-[10px] text-muted-ivory font-mono">Direct image URL. File upload coming in a later release.</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-ivory-100 border border-ivory-border flex items-center justify-center text-ink-text font-bold text-sm font-serif overflow-hidden shadow-editorial">
                {profileForm.avatar ? (
                  <img src={profileForm.avatar} alt="avatar" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  (profileForm.name || user.name || "?").charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-xs text-muted-ivory font-mono">Avatar Preview</span>
            </div>

            <div>
              <button
                type="submit"
                disabled={profileSubmitting}
                className="w-full flex justify-center rounded-lg bg-ink-text px-5 py-3 text-sm font-medium text-ivory-text transition hover:bg-ink-800 active:scale-[0.98] disabled:opacity-50"
              >
                {profileSubmitting ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white border border-ivory-border rounded-xl p-8 shadow-editorial">
          <h3 className="text-xs font-mono uppercase tracking-wide text-muted-ivory border-b border-ivory-border pb-3 mb-6 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-brass" />
            Change Password
          </h3>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            {passwordError && (
              <div className="rounded-lg border border-brick/20 bg-brick/5 p-3 text-sm text-brick flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="rounded-lg border border-moss/20 bg-moss/5 p-3 text-sm text-moss flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {passwordSuccess}
              </div>
            )}

            <div>
              <label className="block text-xs uppercase tracking-wide text-muted-ivory mb-1.5">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-muted-ivory mb-1.5">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-muted-ivory mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                className="block w-full rounded-lg border border-ivory-border bg-white px-4 py-3 text-sm text-ink-text placeholder-muted-ink outline-none transition focus:border-brass/50 focus:ring-1 focus:ring-brass/30"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={passwordSubmitting}
                className="w-full flex justify-center rounded-lg bg-ink-text px-5 py-3 text-sm font-medium text-ivory-text transition hover:bg-ink-800 active:scale-[0.98] disabled:opacity-50"
              >
                {passwordSubmitting ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </DashboardLayout>
  );
}
