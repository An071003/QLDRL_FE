"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const fetchUserRole = async () => {
      try {
        const res = await api.get("/api/auth/me");
        if (isMounted) {
          setRole(res.data.data.user[0].role);
          console.log(res.data.data.user);
        }
      } catch (error) {
        if (isMounted) {
          router.push("/login");
        }
      }
    };

    fetchUserRole();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!role) return;

    if (role === "admin") {
      router.push("/uit/admin");
    } else if (role === "student") {
      router.push("/uit/student");
    } else if (role === "lecturer") {
      router.push("/uit/lecturer");
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
