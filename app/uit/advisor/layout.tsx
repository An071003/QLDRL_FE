'use client';

import Link from "next/link";
import { DataProvider } from '@/lib/contexts/DataContext';
import { useRouter } from "next/navigation";

const Sidebar = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <div className="bg-gray-800 text-white w-64 h-screen fixed left-0 top-0 p-4 flex flex-col">
      <div className="text-xl font-bold mb-8">Advisor Dashboard</div>
      <nav className="space-y-2 flex-grow">
        <Link href="/uit/advisor/profile" className="block py-2 px-4 rounded hover:bg-gray-700">
          Thông tin cá nhân
        </Link>

        <Link href="/uit/advisor/students" className="block py-2 px-4 rounded hover:bg-gray-700">
          Sinh viên
        </Link>

        <Link href="/uit/advisor/faculties" className="block py-2 px-4 rounded hover:bg-gray-700">
          Khoa
        </Link>

        <Link href="/uit/advisor/classes" className="block py-2 px-4 rounded hover:bg-gray-700">
          Lớp
        </Link>

        <Link href="/uit/advisor/criterias" className="block py-2 px-4 rounded hover:bg-gray-700">
          Tiêu chí
        </Link>

        <Link href="/uit/advisor/campaigns" className="block py-2 px-4 rounded hover:bg-gray-700">
          Phong trào
        </Link>

        <Link href="/uit/advisor/activities" className="block py-2 px-4 rounded hover:bg-gray-700">
          Hoạt động
        </Link>

        <Link href="/uit/advisor/student-scores" className="block py-2 px-4 rounded hover:bg-gray-700">
          Điểm rèn luyện
        </Link>
      </nav>
      <div className="mt-auto">
        <button
          onClick={handleLogout}
          className="w-full text-left py-2 px-4 rounded hover:bg-gray-700"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <div>
        <Sidebar />
        <main className="ml-64 p-4">
          {children}
        </main>
      </div>
    </DataProvider>
  );
} 