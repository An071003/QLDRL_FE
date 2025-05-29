'use client';

import { MainLayout } from "@/components/layout/main";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (window.location.pathname === '/') {
      router.push('/login');
    }
  }, [router]);

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chào mừng đến với Hệ thống Quản lý điểm rèn luyện</h1>
          <p className="mb-4">Đang chuyển hướng...</p>
        </div>
      </div>
    </MainLayout>
  );
}
