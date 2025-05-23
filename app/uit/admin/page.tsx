"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/uit/admin/users');
  }, [router]);

  return <div className="p-8">Đang chuyển hướng...</div>;
}