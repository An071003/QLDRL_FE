'use client';

import { MainLayout } from "@/components/layout/main";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chào mừng đến với Hệ thống Quản lý điểm rèn luyện</h1>
        </div>
      </div>
    </MainLayout>
  );
}
