'use client';

import { StudentDataProvider } from '@/lib/contexts/StudentDataContext';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentDataProvider>
      {children}
    </StudentDataProvider>
  );
} 