import Link from "next/link";

const Sidebar = () => {
  return (
    <div className="bg-gray-800 text-white w-64 h-screen fixed left-0 top-0 p-4 flex flex-col">
      <div className="text-xl font-bold mb-8">Lecturer Dashboard</div>
      <nav className="space-y-2 flex-grow">

        <Link href="/uit/lecturer/students" className="block py-2 px-4 rounded hover:bg-gray-700">
          Students
        </Link>

        <Link href="/uit/lecturer/criterias" className="block py-2 px-4 rounded hover:bg-gray-700">
          Criterias
        </Link>

        <Link href="/uit/lecturer/campaigns" className="block py-2 px-4 rounded hover:bg-gray-700">
          Campaigns
        </Link>

        <Link href="/uit/lecturer/activities" className="block py-2 px-4 rounded hover:bg-gray-700">
          Activities
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

export default function LecturerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Sidebar />
      <main className="ml-64 p-4">
        {children}
      </main>
    </div>
  );
}
