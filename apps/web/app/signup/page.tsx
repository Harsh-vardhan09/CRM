"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"company" | "employee">("company");

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      let endpoint = "";
      let payload = {};

      if (activeTab === "company") {
        endpoint = `${API_URL}/auth/signup/company`;
        payload = { companyName, name, email, password };
      } else {
        endpoint = `${API_URL}/auth/signup/employee`;
        payload = { companyId: Number(companyId), name, email, password };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "An error occurred during registration.");
      } else {
        if (activeTab === "company") {
          // Redirect the CEO to the admin panel
          router.push("/admin/join-requests");
        } else {
          setSuccess(
            data.message ||
              "Your request was submitted and is awaiting approval.",
          );
          // Clear form on success
          setCompanyName("");
          setCompanyId("");
          setName("");
          setEmail("");
          setPassword("");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative gradient backgrounds */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl"></div>

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Create an Account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Register a new workspace or join your team
          </p>
        </div>

        {/* Glassmorphic Card */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex p-1 space-x-1 bg-slate-950/50 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("company");
                setError("");
                setSuccess("");
              }}
              className={`w-full py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "company"
                  ? "bg-indigo-500 text-white shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              New Company
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("employee");
                setError("");
                setSuccess("");
              }}
              className={`w-full py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "employee"
                  ? "bg-violet-500 text-white shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              Join Company
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-400">
                {success}
              </div>
            )}

            {activeTab === "company" ? (
              <div>
                <label
                  htmlFor="companyName"
                  className="block text-sm font-medium text-slate-300"
                >
                  Company Name
                </label>
                <div className="mt-1">
                  <input
                    id="companyName"
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Acme Corp"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="companyId"
                  className="block text-sm font-medium text-slate-300"
                >
                  Company ID
                </label>
                <div className="mt-1">
                  <input
                    id="companyId"
                    type="number"
                    required
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="1"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-slate-300"
              >
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-300"
              >
                Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:from-indigo-600 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50"
              >
                {isLoading ? "Submitting..." : "Sign Up"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
