"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const res = await api.get("/api/auth/me");
        setRole(res.data.data.user.Role.name);
      } catch (error) {
        router.push("/login");
      }
    };

    fetchUserRole();

    return () => {
    };
  }, [router]);

  useEffect(() => {
    if (!role) return;
    console.log(role);
    if (role === "admin") {
      router.push("/uit/admin/users");
    } else if (role === "student") {
      router.push("/uit/student");
    } else if (role === "advisor") {
      router.push("/uit/advisor/profile");
    } else {
      router.push("/login");
    }
  }, [role, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      {role ? "Redirecting..." : "Loading..."}
    </div>
  );
}
