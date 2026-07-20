"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

type Role = {
  id: number;
  name: string;
};

type User = {
  id: number;
  name: string;
  email: string;
  status: string;
  lastLoginAt: string | null;
  role: {
    id: number;
    name: string;
  } | null;
};

export default function TeamManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | string>('');
  const [savingId, setSavingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          fetch(`${API_BASE}/team/active`, { credentials: 'include' }),
          fetch(`${API_BASE}/auth/company/roles`, { credentials: 'include' })
        ]);

        if (usersRes.status === 401 || usersRes.status === 403) {
          setErrorStatus(usersRes.status);
          setLoading(false);
          return;
        }

        if (usersRes.ok && rolesRes.ok) {
          const usersData = await usersRes.json();
          const rolesData = await rolesRes.json();
          setUsers(usersData);
          setFilteredUsers(usersData);
          setRoles(rolesData.data || []);
        }
      } catch (e) {
        console.error('Error fetching team data:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(u => 
        u.name.toLowerCase().includes(lowerQuery) || 
        u.email.toLowerCase().includes(lowerQuery)
      ));
    }
  }, [searchQuery, users]);

  const handleSaveRole = async (userId: number) => {
    setSavingId(userId);
    try {
      const res = await fetch(`${API_BASE}/team/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ roleId: selectedRoleId === '' ? null : Number(selectedRoleId) })
      });

      if (res.ok) {
        const data = await res.json();
        // Update local state
        setUsers(users.map(u => u.id === userId ? { 
          ...u, 
          role: selectedRoleId === '' ? null : { id: Number(selectedRoleId), name: roles.find(r => r.id === Number(selectedRoleId))?.name || '' } 
        } : u));
        
        setToastMessage({ type: 'success', text: 'Role updated successfully!' });
        setEditingUserId(null);
      } else {
        const errorData = await res.json();
        setToastMessage({ type: 'error', text: errorData.message || 'Failed to update role' });
      }
    } catch (e) {
      setToastMessage({ type: 'error', text: 'An unexpected error occurred' });
    } finally {
      setSavingId(null);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (errorStatus === 401 || errorStatus === 403) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-6">You must be an Administrator or Organization Owner to access Team Management.</p>
          <Link href="/" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-200 py-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative gradient backgrounds */}
      <div className="absolute top-0 right-0 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -z-10 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl"></div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl border shadow-lg text-white font-medium flex items-center transform transition-all duration-300 ease-out ${
          toastMessage.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400'
        }`}>
          {toastMessage.type === 'success' ? (
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          )}
          {toastMessage.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 mb-4 transition-colors">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-100 to-indigo-400 bg-clip-text text-transparent tracking-tight">Team Management</h1>
            <p className="mt-2 text-sm text-slate-400">Manage your active employees and assign access roles.</p>
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              placeholder="Search team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-800 rounded-xl bg-slate-900/60 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-80 sm:text-sm text-slate-200 placeholder-slate-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="backdrop-blur-xl bg-slate-900/40 shadow-2xl rounded-2xl overflow-hidden border border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800/60">
              <thead className="bg-slate-950/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Last Login</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No team members found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-200">{user.name}</div>
                            <div className="text-sm text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-500 rounded-full"></span>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === user.id ? (
                          <select
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            className="block w-full pl-3 pr-10 py-1.5 text-sm border-slate-700 bg-slate-800 text-slate-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-lg outline-none"
                          >
                            <option value="">No Role</option>
                            {roles.map(role => (
                              <option key={role.id} value={role.id}>{role.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 text-sm font-medium rounded-md border ${
                            user.role ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}>
                            {user.role ? user.role.name : 'Unassigned'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {currentUser?.id === user.id ? (
                          <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-900 border border-slate-800 text-slate-500">
                            Current User
                          </span>
                        ) : editingUserId === user.id ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleSaveRole(user.id)}
                              disabled={savingId === user.id}
                              className="text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center shadow-md disabled:opacity-50"
                            >
                              {savingId === user.id ? (
                                <svg className="animate-spin h-4 w-4 mr-1 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                              ) : (
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                              )}
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingUserId(null);
                                setSelectedRoleId('');
                              }}
                              disabled={savingId === user.id}
                              className="text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold transition-colors hover:bg-slate-700 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingUserId(user.id);
                              setSelectedRoleId(user.role?.id || '');
                            }}
                            className="text-indigo-400 hover:text-white font-medium px-3 py-1.5 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
                          >
                            Edit Role
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
