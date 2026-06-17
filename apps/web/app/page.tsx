'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="flex flex-col items-center space-y-4">
        {/* Sleek loading indicator */}
        <div className="w-12 h-12 border-4 border-t-indigo-500 border-indigo-200 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium text-lg animate-pulse">Checking credentials...</p>
      </div>
    </div>
  );
}
