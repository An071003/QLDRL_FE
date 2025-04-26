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
        setRole(res.data.data.user.role);
        console.log(res.data);
      } catch (error) {
        router.push("/login");
      }
    };

    fetchUserRole();
  }, [router]);

  useEffect(() => {
    if (role === "admin") {
      router.push("/uit/admin");
    } else if (role === "student") {
      router.push("/uit/student");
    } else if (role === "lecturer") {
      router.push("/uit/lecturer");
    }
  }, [role, router]);

  if (!role) return <div>Loading...</div>;

  return <div>Redirecting...</div>;
}
