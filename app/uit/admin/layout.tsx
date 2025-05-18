'use client';

import Link from "next/link";
import { DataProvider } from '@/lib/contexts/DataContext';

const Sidebar = () => {
  return (
    <div className="bg-gray-800 text-white w-64 h-screen fixed left-0 top-0 p-4 flex flex-col">
      <div className="text-xl font-bold mb-8">Admin Dashboard</div>
      <nav className="space-y-2 flex-grow">
        <Link href="/uit/admin/users" className="block py-2 px-4 rounded hover:bg-gray-700">
          User Management
        </Link>
        <Link href="/uit/admin/students" className="block py-2 px-4 rounded hover:bg-gray-700">
          Student Management
        </Link>
        <Link href="/uit/admin/advisors" className="block py-2 px-4 rounded hover:bg-gray-700">
          Advisor Management
        </Link>
        <Link href="/uit/admin/faculties" className="block py-2 px-4 rounded hover:bg-gray-700">
          Faculty Management
        </Link>
        <Link href="/uit/admin/classes" className="block py-2 px-4 rounded hover:bg-gray-700">
          Class Management
        </Link>
        <Link href="/uit/admin/criterias" className="block py-2 px-4 rounded hover:bg-gray-700">
          Criteria Management
        </Link>
        <Link href="/uit/admin/campaigns" className="block py-2 px-4 rounded hover:bg-gray-700">
          Campaigns Management
        </Link>
        <Link href="/uit/admin/activities" className="block py-2 px-4 rounded hover:bg-gray-700">
          Activities Management
        </Link>
        <Link href="/uit/admin/roles" className="block py-2 px-4 rounded hover:bg-gray-700">
          Role Management
        </Link>
      </nav>
      <div className="mt-auto">
        <Link href="/logout" className="block py-2 px-4 rounded hover:bg-gray-700">
          Logout
        </Link>
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
