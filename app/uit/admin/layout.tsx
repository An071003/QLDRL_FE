import Link from "next/link";

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

        <Link href="/uit/admin/criterias" className="block py-2 px-4 rounded hover:bg-gray-700">
          Criteria Management
        </Link>

        <Link href="/uit/admin/campaigns" className="block py-2 px-4 rounded hover:bg-gray-700">
          Campaigns Management
        </Link>

        <Link href="/uit/admin/activities" className="block py-2 px-4 rounded hover:bg-gray-700">
          Activities Management
        </Link>

        <Link href="/uit/admin/semesters" className="block py-2 px-4 rounded hover:bg-gray-700">
          Semesters Management
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
    <div>
      <Sidebar />
      <main className="ml-64 p-4">
        {children}
      </main>
    </div>
  );
}
