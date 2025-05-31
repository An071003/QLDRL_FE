'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataProvider } from '@/lib/contexts/DataContext';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const router = useRouter();
  const [openSections, setOpenSections] = useState<string[]>([]);

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

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isOpen = (sectionId: string) => openSections.includes(sectionId);

  const menuSections = [
    {
      id: 'users',
      title: 'Quản lý người dùng',
      items: [
        { href: '/uit/admin/users', label: 'Tài khoản' },
        { href: '/uit/admin/students', label: 'Sinh viên' },
        { href: '/uit/admin/advisors', label: 'Cố vấn học tập' },
        { href: '/uit/admin/department-officers', label: 'Cán bộ khoa' },
      ]
    },
    {
      id: 'categories',
      title: 'Danh mục',
      items: [
        { href: '/uit/admin/faculties', label: 'Khoa' },
        { href: '/uit/admin/classes', label: 'Lớp' },
      ]
    },
    {
      id: 'activities',
      title: 'Quản lý hoạt động',
      items: [
        { href: '/uit/admin/criterias', label: 'Tiêu chí' },
        { href: '/uit/admin/campaigns', label: 'Chiến dịch' },
        { href: '/uit/admin/activities', label: 'Hoạt động' },
      ]
    },
    {
      id: 'config',
      title: 'Cấu hình',
      items: [
        { href: '/uit/admin/roles', label: 'Vai trò' },
        { href: '/uit/admin/semesters', label: 'Học kỳ' },
      ]
    },
    {
      id: 'scores',
      title: 'Quản lý điểm',
      items: [
        { href: '/uit/admin/student-scores', label: 'Điểm rèn luyện' },
      ]
    }
  ];

  return (
    <div className="bg-gray-800 text-white w-64 h-screen fixed left-0 top-0 p-4 flex flex-col">
      <div className="text-xl font-bold mb-8">Bảng điều khiển Admin</div>
      <nav className="space-y-1 flex-grow">
        {menuSections.map((section) => (
          <div key={section.id} className="mb-2">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between py-2 px-4 rounded hover:bg-gray-700 text-left"
            >
              <span className="font-medium">{section.title}</span>
              {isOpen(section.id) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            {isOpen(section.id) && (
              <div className="ml-4 mt-1 space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block py-2 px-4 rounded hover:bg-gray-700 text-sm text-gray-300 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
