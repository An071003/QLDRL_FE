import { ReactNode } from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Admin dashboard for student discipline management',
};

const Sidebar = () => {
  return (
    <div className="bg-gray-800 text-white w-64 h-screen fixed left-0 top-0 p-4">
      <div className="text-xl font-bold mb-8">Admin Dashboard</div>
      <nav className="space-y-2">
        <Link href="/admin" className="block py-2 px-4 rounded hover:bg-gray-700">
          Dashboard
        </Link>
        <Link href="/admin/users" className="block py-2 px-4 rounded hover:bg-gray-700">
          User Management
        </Link>
        <Link href="/admin/students" className="block py-2 px-4 rounded hover:bg-gray-700">
          Student Management
        </Link>
        <Link href="/admin/criteria" className="block py-2 px-4 rounded hover:bg-gray-700">
          Criteria Management
        </Link>
        <Link href="/admin/activities" className="block py-2 px-4 rounded hover:bg-gray-700">
          Activities
        </Link>
        <Link href="/admin/campaigns" className="block py-2 px-4 rounded hover:bg-gray-700">
          Campaigns
        </Link>
        <Link href="/admin/reports" className="block py-2 px-4 rounded hover:bg-gray-700">
          Reports
        </Link>
      </nav>
    </div>
  );
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Sidebar />
      <div className="ml-64 p-6">{children}</div>
    </div>
  );
} 