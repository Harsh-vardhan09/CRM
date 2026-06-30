"use client";

import React, { useState, useEffect } from "react";

interface JoinRequest {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

interface Role {
  id: number;
  name: string;
}

export default function JoinRequestsPage() {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // For the approve modal
  const [selectedUser, setSelectedUser] = useState<JoinRequest | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | "">("");
  const [isApproving, setIsApproving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const [reqsRes, rolesRes] = await Promise.all([
        fetch(`${API_URL}/auth/company/join-requests`, {
          // In a real app we would use credentials: 'include' if cookies are used,
          // but assuming we are relying on cookies for auth:
          credentials: "include",
        }),
        fetch(`${API_URL}/auth/company/roles`, {
          credentials: "include",
        }),
      ]);

      if (!reqsRes.ok || !rolesRes.ok) {
        throw new Error(
          "Failed to fetch data. Ensure you are logged in as an Admin.",
        );
      }

      const reqsData = await reqsRes.json();
      const rolesData = await rolesRes.json();

      setRequests(reqsData.data || []);
      setRoles(rolesData.data || []);

      if (rolesData.data && rolesData.data.length > 0) {
        setSelectedRoleId(rolesData.data[0].id);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async () => {
    if (!selectedUser || !selectedRoleId) return;

    setIsApproving(true);
    setError("");
    setSuccess("");

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/auth/company/join-requests/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId: selectedUser.id,
          roleId: selectedRoleId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to approve user.");

      setSuccess(`User ${selectedUser.name} has been approved.`);
      setRequests(requests.filter((req) => req.id !== selectedUser.id));
      setSelectedUser(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to reject ${userName}?`)) return;

    setError("");
    setSuccess("");

    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_URL}/auth/company/join-requests/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reject user.");

      setSuccess(`User ${userName} has been rejected.`);
      setRequests(requests.filter((req) => req.id !== userId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="relative flex min-h-screen items-start justify-center overflow-hidden bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      {/* Decorative gradient backgrounds */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-72 w-72 translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl"></div>

      <div className="w-full max-w-4xl space-y-8 z-10">
        <div className="flex flex-col items-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            Join Requests
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Manage pending employee access requests for your workspace.
          </p>
        </div>

        {/* Glassmorphic Card */}
        <div className="backdrop-blur-xl bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-sm text-emerald-400">
              {success}
            </div>
          )}

          {isLoading ? (
            <div className="text-center text-slate-400 py-8">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center text-slate-500 py-12 bg-slate-950/30 rounded-xl border border-slate-800 border-dashed">
              No pending join requests.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl transition-all hover:bg-slate-800/50"
                >
                  <div className="mb-4 sm:mb-0">
                    <h3 className="text-lg font-medium text-slate-200">
                      {req.name}
                    </h3>
                    <p className="text-sm text-slate-400">{req.email}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Requested on{" "}
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedUser(req)}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(req.id, req.name)}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-100 mb-2">
              Approve {selectedUser.name}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              Select a role for this user.
            </p>

            <div className="mb-6">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Assign Role
              </label>
              <select
                id="role"
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setSelectedUser(null)}
                disabled={isApproving}
                className="px-4 py-2 text-sm font-medium rounded-lg text-slate-300 hover:bg-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-md disabled:opacity-50"
              >
                {isApproving ? "Approving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
