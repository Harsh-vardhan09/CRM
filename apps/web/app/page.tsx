"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (user.role?.toLowerCase() === "admin" || user.role?.toLowerCase() === "super_admin") {
        router.push("/admin");
      } else {
        router.push("/user");
      }
    }
  }, [user, loading, router]);

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
