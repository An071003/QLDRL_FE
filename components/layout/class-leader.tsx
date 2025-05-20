import Link from 'next/link';
import ClassleaderDropdown from "@/components/class-leader/ClassleaderDropdown";

export const metadata = {
  title: 'Trang dành cho lớp trưởngtrưởng',
};

export function ClassleaderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="flex items-center justify-between py-4 px-6 border-b bg-[#0b3c65] border-blue-900 text-white">
        <div className="flex items-center space-x-4">
          <img src="/banner.png" alt="Logo" className="w-[90%] h-auto text-[50px] object-contain" />

        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <Link href="/login" className="hover:underline">Tài khoản</Link>
            <span className="text-sm"> | </span>
            <Link href="/login" className="hover:underline">Thoát</Link>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search this site..."
              className="rounded-full px-4 py-1 text-gray-500 bg-white border border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
              🔍
            </button>
          </div>
        </div>
      </header>

      <nav className="flex items-center p-2 bg-[#0a3a60]">
        <Link href="/uit/student" className="flex items-center space-x-2">
          <img src="/house-user-solid.svg" alt="Home" className="w-8 h-8" />
        </Link>
        <div className="ml-4 mt-1.5">
          <ClassleaderDropdown />
        </div>

      </nav>

      <main className="p-4">
        {children}
      </main>
    </div>
  );
}
